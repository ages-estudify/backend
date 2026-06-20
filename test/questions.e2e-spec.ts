import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';

describe('Questions e2e flows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentUserId: string;
  let createdUserId: string;
  let subjectId: string;
  let pathId: string;
  let questionAId: string;
  let questionBId: string;
  const createdQuestionIds: string[] = [];
  const baseQuestions = '/api/v1/questions';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: currentUserId, role: 'USER' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'v' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const subject = await prisma.subject.create({
      data: {
        name: `e2e-questions-subject-${randomUUID()}`,
        icon_url: 'https://example.com/icon.png',
      },
    });
    subjectId = subject.id;

    const schedulePosition = Math.floor(Math.random() * 1_000_000) + 1_000_000;
    const path = await prisma.path.create({
      data: {
        name: `e2e-questions-path-${randomUUID()}`,
        text: 'E2E questions topic',
        icon_key: 'e2e-path-icon',
        schedule_position: schedulePosition,
        trail_position: 1,
        enable: true,
        subject_id: subjectId,
      },
    });
    pathId = path.id;

    const questionA = await prisma.question.create({
      data: {
        text: 'Qual é a capital do Brasil?',
        origin: 'ORIGINAL',
        year: 2026,
        path_id: pathId,
        feedback: 'A capital do Brasil é Brasília.',
        number: 1,
      },
    });
    questionAId = questionA.id;
    createdQuestionIds.push(questionAId);

    const questionB = await prisma.question.create({
      data: {
        text: 'Qual é o maior planeta do sistema solar?',
        origin: 'ORIGINAL',
        year: 2026,
        path_id: pathId,
        feedback: 'O maior planeta é Júpiter.',
        number: 2,
      },
    });
    questionBId = questionB.id;
    createdQuestionIds.push(questionBId);

    await prisma.alternative.createMany({
      data: [
        {
          question_id: questionAId,
          text: 'Brasília',
          letter: 'A',
          is_correct: true,
        },
        {
          question_id: questionAId,
          text: 'São Paulo',
          letter: 'B',
          is_correct: false,
        },
        {
          question_id: questionAId,
          text: 'Rio de Janeiro',
          letter: 'C',
          is_correct: false,
        },
        {
          question_id: questionBId,
          text: 'Júpiter',
          letter: 'B',
          is_correct: true,
        },
        {
          question_id: questionBId,
          text: 'Marte',
          letter: 'A',
          is_correct: false,
        },
        {
          question_id: questionBId,
          text: 'Terra',
          letter: 'C',
          is_correct: false,
        },
      ],
    });
  });

  beforeEach(async () => {
    createdUserId = randomUUID();
    currentUserId = createdUserId;

    await prisma.user.create({
      data: {
        id: createdUserId,
        full_name: `e2e questions user ${randomUUID()}`,
        email: `e2e-questions-${randomUUID()}@example.com`,
        password: 'e2e-password',
        phone_number: `+1555${Math.floor(Math.random() * 1_000_000_000)
          .toString()
          .padStart(9, '0')}`,
        role: 'USER',
        enable: true,
        plan_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });
  });

  afterEach(async () => {
    if (createdUserId) {
      await prisma.answer.deleteMany({ where: { user_id: createdUserId } });
      await prisma.attemptDay
        .deleteMany({ where: { attempt: { user_id: createdUserId } } })
        .catch(() => undefined);
      await prisma.attempt.deleteMany({ where: { user_id: createdUserId } }).catch(() => undefined);
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
  });

  afterAll(async () => {
    await prisma.alternative.deleteMany({ where: { question_id: { in: createdQuestionIds } } });
    await prisma.question.deleteMany({ where: { id: { in: createdQuestionIds } } });
    await prisma.path.delete({ where: { id: pathId } });
    await prisma.subject.delete({ where: { id: subjectId } });
    await app.close();
    await prisma.$disconnect();
  });

  it('returns a question batch for the topic and session progress', async () => {
    const response = await request(app.getHttpServer())
      .get(`${baseQuestions}/${pathId}?type=SIMPLIFIED&limit=2`)
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.questions).toHaveLength(2);
    expect(response.body.data.sessionProgress).toEqual({ current: 0, total: 2 });
    expect(response.body.data.questions[0].alternatives).toHaveLength(3);
  });

  it('answers a question and excludes it from the next batch by default', async () => {
    const batchRes = await request(app.getHttpServer())
      .get(`${baseQuestions}/${pathId}?type=SIMPLIFIED&limit=2`)
      .expect(200);

    const question = batchRes.body.data.questions[0];
    const selectedAnswer = question.id === questionAId ? 'A' : 'B';
    const expectedCorrectAnswer = selectedAnswer;
    const expectedExplanation =
      question.id === questionAId
        ? 'A capital do Brasil é Brasília.'
        : 'O maior planeta é Júpiter.';

    const answerRes = await request(app.getHttpServer())
      .post(`${baseQuestions}/${question.id}/answer`)
      .send({ selectedAnswer })
      .expect(200);

    expect(answerRes.body.success).toBe(true);
    expect(answerRes.body.data).toMatchObject({
      isCorrect: true,
      correctAnswer: expectedCorrectAnswer,
      explanation: expectedExplanation,
      coinsEarned: 1,
      streakActive: true,
    });

    const nextBatch = await request(app.getHttpServer())
      .get(`${baseQuestions}/${pathId}?type=SIMPLIFIED&limit=2`)
      .expect(200);

    expect(nextBatch.body.data.questions).toHaveLength(1);
    expect(nextBatch.body.data.sessionProgress.current).toBe(1);
  });

  it('returns training results after all questions are answered', async () => {
    await request(app.getHttpServer())
      .post(`${baseQuestions}/${questionAId}/answer`)
      .send({ selectedAnswer: 'A' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`${baseQuestions}/${questionBId}/answer`)
      .send({ selectedAnswer: 'B' })
      .expect(200);

    const trainingRes = await request(app.getHttpServer())
      .post(`${baseQuestions}/training/result`)
      .send({ questionsIds: [questionAId, questionBId] })
      .expect(200);

    expect(trainingRes.body.success).toBe(true);
    expect(trainingRes.body.data).toEqual({
      totalQuestions: 2,
      correctAnswers: 2,
      wrongAnswers: 0,
    });
  });

  it('rejects incomplete training sessions with a 400 response', async () => {
    await request(app.getHttpServer())
      .post(`${baseQuestions}/${questionAId}/answer`)
      .send({ selectedAnswer: 'A' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`${baseQuestions}/training/result`)
      .send({ questionsIds: [questionAId, questionBId] })
      .expect(400);
  });
});
