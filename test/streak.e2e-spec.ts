import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';

describe('Streak e2e flows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentUserId: string;
  let createdUserId: string;
  let subjectId: string;
  let pathId: string;
  let questionAId: string;
  let questionBId: string;
  const createdQuestionIds: string[] = [];
  const baseUsers = '/api/v1/users';
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
        name: `e2e-streak-subject-${randomUUID()}`,
        icon_url: 'https://example.com/icon.png',
      },
    });
    subjectId = subject.id;

    const schedulePosition = Math.floor(Math.random() * 1_000_000) + 1_000_000;
    const path = await prisma.path.create({
      data: {
        name: `e2e-streak-path-${randomUUID()}`,
        text: 'E2E streak path',
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
        full_name: `e2e streak user ${randomUUID()}`,
        email: `e2e-streak-${randomUUID()}@example.com`,
        password: 'e2e-password',
        phone_number: `+1555${Math.floor(Math.random() * 1_000_000_000)
          .toString()
          .padStart(9, '0')}`,
        role: 'USER',
        enable: true,
        plan_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        streak: null,
        last_active: null,
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

  it('returns an inactive streak when the user has never answered', async () => {
    const response = await request(app.getHttpServer()).get(`${baseUsers}/streak`).expect(200);

    expect(response.body).toEqual({ streakDays: 0, streakActive: false });
  });

  it('activates the streak after a first correct answer and keeps the streak on the same day', async () => {
    const answerRes = await request(app.getHttpServer())
      .post(`${baseQuestions}/${questionAId}/answer`)
      .send({ selectedAnswer: 'A' })
      .expect(200);

    expect(answerRes.body.data).toMatchObject({
      isCorrect: true,
      streakActive: true,
      streakDays: 1,
    });

    const streakAfterFirstAnswer = await request(app.getHttpServer())
      .get(`${baseUsers}/streak`)
      .expect(200);
    expect(streakAfterFirstAnswer.body).toEqual({ streakDays: 1, streakActive: true });

    const secondAnswerRes = await request(app.getHttpServer())
      .post(`${baseQuestions}/${questionBId}/answer`)
      .send({ selectedAnswer: 'B' })
      .expect(200);

    expect(secondAnswerRes.body.data.streakActive).toBe(true);
    expect(secondAnswerRes.body.data.streakDays).toBe(1);

    const streakAfterSecondAnswer = await request(app.getHttpServer())
      .get(`${baseUsers}/streak`)
      .expect(200);
    expect(streakAfterSecondAnswer.body).toEqual({ streakDays: 1, streakActive: true });
  });
});
