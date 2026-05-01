import { ExamService } from './exams.service';

describe('ExamService', () => {
  let service: ExamService;

  const mockRepository = {
    findAllExams: jest.fn(),
    findAllAttemptsByUser: jest.fn(),
  };

  beforeEach(() => {
    service = new ExamService(mockRepository as any);
    jest.clearAllMocks();
  });

  it('should merge exams with attempts correctly', async () => {
    mockRepository.findAllExams.mockResolvedValue([
      {
        id: '1',
        name: 'Simulado 1',
        image_url: 'img',
        origin: 'EXTERNAL',
        exam_days: [{ _count: { questions: 10 } }, { _count: { questions: 20 } }],
        totalQuestions: 30,
      },
    ]);

    mockRepository.findAllAttemptsByUser.mockResolvedValue([
      {
        exam_id: '1',
        isCompleted: true,
        totalAnswers: 25,
        attempt_days: [
          {
            exam_day: { day: 1 },
            _count: { answers: 10 },
            isCompleted: true,
          },
          {
            exam_day: { day: 2 },
            _count: { answers: 15 },
            isCompleted: true,
          },
        ],
      },
    ]);

    const result = await service.findAllWithLastAttemptByUser('user-1');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);

    const exam = result.data[0];

    // 🧠 identity
    expect(exam.id).toBe('1');

    // 📊 totals
    expect(exam.totalQuestions).toBe(30);
    expect(exam.answeredQuestions).toBe(25);

    // 📅 days existence
    expect(exam.days).toHaveLength(2);

    // 📅 day 1
    expect(exam.days[0]).toMatchObject({
      day: 1,
      totalQuestions: 10,
      answeredQuestions: 10,
      isCompleted: true,
    });

    // 📅 day 2
    expect(exam.days[1]).toMatchObject({
      day: 2,
      totalQuestions: 20,
      answeredQuestions: 15,
      isCompleted: true,
    });

    // 🚦 status logic
    expect(exam.status).toBe('completed');
  });

  it('should return available exam when no attempts exist', async () => {
    mockRepository.findAllExams.mockResolvedValue([
      {
        id: '2',
        name: 'Simulado 2',
        image_url: 'img',
        origin: 'EXTERNAL',
        exam_days: [{ _count: { questions: 10 } }, { _count: { questions: 10 } }],
        totalQuestions: 20,
      },
    ]);

    mockRepository.findAllAttemptsByUser.mockResolvedValue([]);

    const result = await service.findAllWithLastAttemptByUser('user-1');

    const exam = result.data[0];

    expect(exam.status).toBe('available');
    expect(exam.answeredQuestions).toBe(0);
    expect(exam.days[0].answeredQuestions).toBe(0);
    expect(exam.days[1].isCompleted).toBe(false);
  });

  it('should return in_progress when partial answers exist', async () => {
    mockRepository.findAllExams.mockResolvedValue([
      {
        id: '3',
        name: 'Simulado 3',
        image_url: 'img',
        origin: 'EXTERNAL',
        exam_days: [{ _count: { questions: 10 } }, { _count: { questions: 10 } }],
        totalQuestions: 20,
      },
    ]);

    mockRepository.findAllAttemptsByUser.mockResolvedValue([
      {
        exam_id: '3',
        isCompleted: false,
        totalAnswers: 5,
        attempt_days: [
          {
            exam_day: { day: 1 },
            _count: { answers: 5 },
            isCompleted: true,
          },
        ],
      },
    ]);

    const result = await service.findAllWithLastAttemptByUser('user-1');

    const exam = result.data[0];

    expect(exam.status).toBe('in_progress');
    expect(exam.answeredQuestions).toBe(5);
  });
});
