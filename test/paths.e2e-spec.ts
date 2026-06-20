import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';
import { Origin } from '@prisma/client';

describe('Paths e2e flows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentUserId: string;
  let createdUserId: string;
  let subjectId: string;
  let pathId: string;
  let originalQuestionId: string;
  let externalQuestionId: string;
  const baseSubjects = '/api/v1/subjects';

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
        name: `e2e-paths-subject-${randomUUID()}`,
        icon_url: 'https://example.com/icon.png',
      },
    });
    subjectId = subject.id;

    const path = await prisma.path.create({
      data: {
        name: `e2e-paths-topic-${randomUUID()}`,
        text: 'Tópico de paths E2E',
        icon_key: 'https://example.com/path-icon.png',
        schedule_position: Math.floor(Math.random() * 1_000_000) + 1_000_000,
        trail_position: 1,
        enable: true,
        subject_id: subjectId,
      },
    });
    pathId = path.id;

    const originalQuestion = await prisma.question.create({
      data: {
        text: 'Original path question',
        origin: Origin.ORIGINAL,
        year: 2026,
        path_id: pathId,
        feedback: 'Original feedback',
        number: 1,
      },
    });
    originalQuestionId = originalQuestion.id;

    const externalQuestion = await prisma.question.create({
      data: {
        text: 'External path question',
        origin: Origin.EXTERNAL,
        year: 2026,
        path_id: pathId,
        feedback: 'External feedback',
        number: 2,
      },
    });
    externalQuestionId = externalQuestion.id;
  });

  beforeEach(async () => {
    createdUserId = randomUUID();
    currentUserId = createdUserId;

    await prisma.user.create({
      data: {
        id: createdUserId,
        full_name: `e2e paths user ${randomUUID()}`,
        email: `e2e-paths-${randomUUID()}@example.com`,
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
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
  });

  afterAll(async () => {
    await prisma.question.deleteMany({
      where: { id: { in: [originalQuestionId, externalQuestionId] } },
    });
    await prisma.path.delete({ where: { id: pathId } });
    await prisma.subject.delete({ where: { id: subjectId } });
    await app.close();
    await prisma.$disconnect();
  });

  it('returns subject paths with counts for available and answered questions', async () => {
    await prisma.answer.create({
      data: {
        answer_date: new Date(),
        user_id: createdUserId,
        question_id: externalQuestionId,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`${baseSubjects}/${subjectId}/topics`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0]).toMatchObject({
      id: pathId,
      name: expect.any(String),
      icon_key: 'https://example.com/path-icon.png',
      availableByType: {
        ORIGINAL: 1,
        EXTERNAL: 1,
      },
      answeredByType: {
        ORIGINAL: 0,
        EXTERNAL: 1,
      },
    });
  });

  it('returns question counts by path and type', async () => {
    const responseAll = await request(app.getHttpServer())
      .get(`${baseSubjects}/topics/${pathId}/questions/count`)
      .expect(200);

    expect(responseAll.body).toEqual({ total: 2, answered: 0 });

    const responseOriginal = await request(app.getHttpServer())
      .get(`${baseSubjects}/topics/${pathId}/questions/count?type=ORIGINAL`)
      .expect(200);

    expect(responseOriginal.body).toEqual({ total: 1, answered: 0 });

    const responseExternal = await request(app.getHttpServer())
      .get(`${baseSubjects}/topics/${pathId}/questions/count?type=EXTERNAL`)
      .expect(200);

    expect(responseExternal.body).toEqual({ total: 1, answered: 0 });
  });

  it('rejects invalid question count type with a 400 response', async () => {
    await request(app.getHttpServer())
      .get(`${baseSubjects}/topics/${pathId}/questions/count?type=MONTHLY`)
      .expect(400);
  });

  it('returns 404 when subject is not found for paths query', async () => {
    await request(app.getHttpServer()).get(`${baseSubjects}/${randomUUID()}/topics`).expect(404);
  });
});
