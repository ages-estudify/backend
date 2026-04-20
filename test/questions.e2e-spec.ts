import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';

/* eslint-disable @typescript-eslint/no-unsafe-argument */
describe('QuestionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let pathId: string;

  beforeAll(async () => {
    // DATABASE_URL from .env.test is read here before ConfigModule ignores env files
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://postgres:postgres@localhost:5433/backend?schema=public';
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = new JwtService({ secret: process.env.JWT_SECRET ?? 'dev-only-change-me' });
  });

  beforeEach(async () => {
    // Cleanup all test data before each test
    await prisma.answer.deleteMany({});
    await prisma.attempt.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.studyDay.deleteMany();
    await prisma.studyLog.deleteMany();
    await prisma.alternative.deleteMany();
    await prisma.question.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.path.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();

    const email = `e2e-questions-user-${Date.now()}-${Math.random()}@email.com`;
    const phoneNumber = `519999${Math.floor(Math.random() * 900000 + 100000)}-${Date.now()}`;

    const user = await prisma.user.create({
      data: {
        full_name: 'E2E Questions User',
        email,
        password: '123456',
        phone_number: phoneNumber,
        birth_date: new Date('1990-01-01'),
        role: Role.USER,
      },
    });

    authToken = jwtService.sign({ userId: user.id, role: user.role, planExpirationDate: null });

    const pathName = `Teste de Questões ${Date.now()}-${Math.random()}`;
    let path = await prisma.path.findFirst({ where: { name: pathName } });

    if (!path) {
      const subject =
        (await prisma.subject.findFirst({ where: { name: 'Matemática' } })) ||
        (await prisma.subject.create({
          data: { name: 'Matemática', icon_url: 'https://example.com/math-icon.png' },
        }));

      path = await prisma.path.create({
        data: {
          name: pathName,
          schedule_position: Math.floor(Math.random() * 900000) + 100000,
          trail_position: Math.floor(Math.random() * 900000) + 100000,
          subject_id: subject.id,
          text: 'Caminho usado para testes de entrega de questões.',
          icon_url: 'https://example.com/path-icon.png',
        },
      });

      await prisma.question.create({
        data: {
          text: 'E2E Questão ORIGINAL sem imagem',
          origin: 'ORIGINAL',
          year: 2024,
          feedback: 'Questão usada para testes de imagem nula.',
          path_id: path.id,
          alternatives: {
            create: [
              { text: 'A', letter: 'A', is_correct: false },
              { text: 'B', letter: 'B', is_correct: true },
              { text: 'C', letter: 'C', is_correct: false },
              { text: 'D', letter: 'D', is_correct: false },
              { text: 'E', letter: 'E', is_correct: false },
            ],
          },
        },
      });

      await prisma.question.create({
        data: {
          text: 'E2E Questão ORIGINAL com imagem',
          origin: 'ORIGINAL',
          year: 2024,
          feedback: 'Questão usada para testes de imagem string.',
          path_id: path.id,
          image_url: 'https://example.com/e2e-question.png',
          alternatives: {
            create: [
              { text: 'A', letter: 'A', is_correct: false },
              { text: 'B', letter: 'B', is_correct: false },
              { text: 'C', letter: 'C', is_correct: true },
              { text: 'D', letter: 'D', is_correct: false },
              { text: 'E', letter: 'E', is_correct: false },
            ],
          },
        },
      });

      const originalAnswered = await prisma.question.create({
        data: {
          text: 'E2E Questão ORIGINAL respondida',
          origin: 'ORIGINAL',
          year: 2024,
          feedback: 'Questão respondida para excluir em excludeAnswered=true.',
          path_id: path.id,
          alternatives: {
            create: [
              { text: 'A', letter: 'A', is_correct: true },
              { text: 'B', letter: 'B', is_correct: false },
              { text: 'C', letter: 'C', is_correct: false },
              { text: 'D', letter: 'D', is_correct: false },
              { text: 'E', letter: 'E', is_correct: false },
            ],
          },
        },
        include: { alternatives: true },
      });

      await prisma.answer.create({
        data: {
          user_id: user.id,
          question_id: originalAnswered.id,
          alternative_id: originalAnswered.alternatives.find((alt) => alt.is_correct)!.id,
          answer_date: new Date('2026-03-27T10:00:00'),
        },
      });

      const simplifiedImage = await prisma.question.create({
        data: {
          text: 'E2E Questão SIMPLIFIED com imagem',
          origin: 'EXTERNAL',
          year: 2024,
          feedback: 'Questão simplificada com imagem.',
          path_id: path.id,
          image_url: 'https://example.com/e2e-simplified.png',
          alternatives: {
            create: [
              { text: 'A', letter: 'A', is_correct: false },
              { text: 'B', letter: 'B', is_correct: false },
              { text: 'C', letter: 'C', is_correct: true },
              { text: 'D', letter: 'D', is_correct: false },
              { text: 'E', letter: 'E', is_correct: false },
            ],
          },
        },
        include: { alternatives: true },
      });

      const simplifiedAnswered = await prisma.question.create({
        data: {
          text: 'E2E Questão SIMPLIFIED respondida',
          origin: 'EXTERNAL',
          year: 2024,
          feedback: 'Questão simplificada respondida.',
          path_id: path.id,
          alternatives: {
            create: [
              { text: 'A', letter: 'A', is_correct: true },
              { text: 'B', letter: 'B', is_correct: false },
              { text: 'C', letter: 'C', is_correct: false },
              { text: 'D', letter: 'D', is_correct: false },
              { text: 'E', letter: 'E', is_correct: false },
            ],
          },
        },
        include: { alternatives: true },
      });

      const originalWrongAnswered = await prisma.question.create({
        data: {
          text: 'E2E Questão ORIGINAL respondida errada',
          origin: 'ORIGINAL',
          year: 2024,
          feedback: 'Questão respondida incorretamente para testar retrieveWrong.',
          path_id: path.id,
          alternatives: {
            create: [
              { text: 'A', letter: 'A', is_correct: true },
              { text: 'B', letter: 'B', is_correct: false },
              { text: 'C', letter: 'C', is_correct: false },
              { text: 'D', letter: 'D', is_correct: false },
              { text: 'E', letter: 'E', is_correct: false },
            ],
          },
        },
        include: { alternatives: true },
      });

      await prisma.answer.create({
        data: {
          user_id: user.id,
          question_id: originalWrongAnswered.id,
          alternative_id: originalWrongAnswered.alternatives.find((alt) => !alt.is_correct)!.id, // resposta errada
          answer_date: new Date('2026-03-27T10:00:00'),
        },
      });

      await prisma.answer.create({
        data: {
          user_id: user.id,
          question_id: simplifiedImage.id,
          alternative_id: simplifiedImage.alternatives.find((alt) => alt.is_correct)!.id,
          answer_date: new Date('2026-03-27T10:00:00'),
        },
      });

      await prisma.answer.create({
        data: {
          user_id: user.id,
          question_id: simplifiedAnswered.id,
          alternative_id: simplifiedAnswered.alternatives.find((alt) => alt.is_correct)!.id,
          answer_date: new Date('2026-03-27T10:00:00'),
        },
      });
    }

    pathId = path.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should return questions respecting limit and excluding already answered items', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/questions/${pathId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'ORIGINAL', limit: 5, excludeAnswered: true })
      .expect(200);

    expect(response.body.data.questions).toHaveLength(2);
    expect(response.body.data.sessionProgress).toEqual({ current: 2, total: 4 });

    // Verify question structure
    response.body.data.questions.forEach((question: any) => {
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('text');
      expect(question).toHaveProperty('imageUrl');
      expect(question).toHaveProperty('origin');
      expect(question).toHaveProperty('subjectName');
      expect(question).toHaveProperty('topicName');
      expect(question).toHaveProperty('alternatives');

      // Verify origin field
      expect(['ORIGINAL', 'EXTERNAL']).toContain(question.origin);

      // Verify alternatives structure
      question.alternatives.forEach((alt: any) => {
        expect(alt).toHaveProperty('label');
        expect(alt).toHaveProperty('text');
      });
    });

    expect(
      response.body.data.questions.some(
        (item: { imageUrl: string | null }) =>
          item.imageUrl === 'https://example.com/e2e-question.png',
      ),
    ).toBe(true);
    expect(
      response.body.data.questions.some(
        (item: { imageUrl: string | null }) => item.imageUrl === null,
      ),
    ).toBe(true);
    expect(
      response.body.data.questions.every(
        (item: Record<string, unknown>) => !('correctAnswer' in item),
      ),
    ).toBe(true);
    expect(
      response.body.data.questions.every(
        (item: Record<string, unknown>) => !('explanation' in item),
      ),
    ).toBe(true);
  });

  it('should return data null when all SIMPLIFIED questions are answered', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/questions/${pathId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'SIMPLIFIED', limit: 10, excludeAnswered: true })
      .expect(200);

    expect(response.body.data).toBeNull();
    expect(response.body.message).toBe(
      'Todas as questões deste tipo foram respondidas neste tópico',
    );
  });

  it('should return 400 when type is invalid', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/questions/${pathId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'INVALID', limit: 5, excludeAnswered: true })
      .expect(400);
  });

  it('should return 400 when limit is outside allowed interval', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/questions/${pathId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'ORIGINAL', limit: 0, excludeAnswered: true })
      .expect(400);
  });

  it('should return 401 when authorization header is missing', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/questions/${pathId}`)
      .query({ type: 'ORIGINAL', limit: 5, excludeAnswered: true })
      .expect(401);
  });

  it('should return correct payload structure with new fields', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/questions/${pathId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'ORIGINAL', limit: 5, excludeAnswered: true })
      .expect(200);

    const question = response.body.data.questions[0];

    // Verify all required fields exist
    expect(question.id).toBeDefined();
    expect(question.text).toBeDefined();
    expect(question.imageUrl).toBeDefined();
    expect(question.origin).toBeDefined();
    expect(question.subjectName).toBeDefined();
    expect(question.topicName).toBeDefined();
    expect(question.alternatives).toBeDefined();

    // Verify field types
    expect(typeof question.id).toBe('string');
    expect(typeof question.text).toBe('string');
    expect(typeof question.origin).toBe('string');
    expect(typeof question.subjectName).toBe('string');
    expect(typeof question.topicName).toBe('string');
    expect(Array.isArray(question.alternatives)).toBe(true);

    // Verify alternatives structure
    question.alternatives.forEach((alt: any) => {
      expect(typeof alt.label).toBe('string');
      expect(typeof alt.text).toBe('string');
    });
  });

  it('should return 404 for nonexistent topic', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/questions/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'ORIGINAL', limit: 5, excludeAnswered: true })
      .expect(404);
  });

  it('should include all answered questions when excludeAnswered is false and retrieveWrong is true', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/questions/${pathId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'ORIGINAL', limit: 10, excludeAnswered: false, retrieveWrong: true })
      .expect(200);

    expect(response.body.data.questions.length).toBeGreaterThanOrEqual(4); // 2 não respondidas + 2 respondidas
    expect(response.body.data.sessionProgress).toEqual({ current: 2, total: 4 }); // 2 respondidas no total
  });

  it('should include only correct answered questions when excludeAnswered is false and retrieveWrong is false', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/questions/${pathId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'ORIGINAL', limit: 10, excludeAnswered: false, retrieveWrong: false })
      .expect(200);

    expect(response.body.data.questions.length).toBeGreaterThanOrEqual(3); // 2 não respondidas + 1 correta
    expect(response.body.data.sessionProgress).toEqual({ current: 2, total: 4 });
    // Deve incluir a questão correta, mas não a errada
    expect(
      response.body.data.questions.some(
        (item: { text: string }) => item.text === 'E2E Questão ORIGINAL respondida errada',
      ),
    ).toBe(false);
  });
});
/* eslint-enable @typescript-eslint/no-unsafe-argument */
