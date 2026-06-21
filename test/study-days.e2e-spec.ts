import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';

describe('StudyDays e2e flows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentUserId: string;
  let createdUserId: string;
  let subjectId: string;
  let pathId: string;
  const baseSchedule = '/api/v1/schedule';
  const baseOnboarding = '/api/v1/onboarding';
  const createdSubjectIds: string[] = [];
  const createdPathIds: string[] = [];

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
        name: `e2e-study-days-subject-${randomUUID()}`,
        icon_url: 'https://example.com/icon.png',
      },
    });
    subjectId = subject.id;
    createdSubjectIds.push(subjectId);

    const schedulePosition = Math.floor(Math.random() * 1_000_000) + 1_000_000;
    const path = await prisma.path.create({
      data: {
        name: `e2e-study-days-path-${randomUUID()}`,
        text: 'e2e schedule path',
        icon_key: 'e2e-icon',
        schedule_position: schedulePosition,
        trail_position: 1,
        enable: true,
        subject_id: subjectId,
      },
    });
    pathId = path.id;
    createdPathIds.push(pathId);
  });

  beforeEach(async () => {
    createdUserId = randomUUID();
    currentUserId = createdUserId;

    await prisma.user.create({
      data: {
        id: createdUserId,
        full_name: `e2e study user ${randomUUID()}`,
        email: `e2e-study-days-${randomUUID()}@example.com`,
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
      await prisma.studyLog.deleteMany({ where: { user_id: createdUserId } });
      await prisma.studyDay.deleteMany({ where: { user_id: createdUserId } });
      await prisma.refreshToken.deleteMany({ where: { user_id: createdUserId } });
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
  });

  afterAll(async () => {
    await prisma.path.deleteMany({ where: { id: { in: createdPathIds } } });
    await prisma.subject.deleteMany({ where: { id: { in: createdSubjectIds } } });
    await app.close();
    await prisma.$disconnect();
  });

  it('completes onboarding and generates the initial schedule successfully', async () => {
    const onboardingRes = await request(app.getHttpServer())
      .post(baseOnboarding)
      .send({
        studyHours: {
          MONDAY: [10],
          WEDNESDAY: [14],
        },
      })
      .expect(204);

    expect(onboardingRes.body).toEqual({});

    const scheduleRes = await request(app.getHttpServer()).post(baseSchedule).expect(201);
    expect(scheduleRes.body.data).toBeDefined();
    expect(scheduleRes.body.data.generatedItems).toBeGreaterThan(0);
    expect(scheduleRes.body.data.firstDate).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
    expect(scheduleRes.body.data.lastDate).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

    const scheduleAgainRes = await request(app.getHttpServer()).post(baseSchedule);
    expect([200, 201]).toContain(scheduleAgainRes.status);
    if (scheduleAgainRes.status === 200) {
      expect(scheduleAgainRes.body.data.generatedItems).toBe(0);
      expect(scheduleAgainRes.body.data.firstDate).toBe(scheduleRes.body.data.firstDate);
      expect(scheduleAgainRes.body.data.lastDate).toBe(scheduleRes.body.data.lastDate);
    } else {
      expect(scheduleAgainRes.body.data.generatedItems).toBeGreaterThanOrEqual(0);
      expect(scheduleAgainRes.body.data.firstDate).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
      expect(scheduleAgainRes.body.data.lastDate).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
    }
  });

  it('returns a week schedule and marks a schedule item as completed', async () => {
    await request(app.getHttpServer())
      .post(baseOnboarding)
      .send({
        studyHours: {
          TUESDAY: [9],
          THURSDAY: [17],
        },
      })
      .expect(204);

    const scheduleRes = await request(app.getHttpServer()).post(baseSchedule).expect(201);
    const weekStart = scheduleRes.body.data.firstDate;

    const weekRes = await request(app.getHttpServer())
      .get(`${baseSchedule}?weekStart=${weekStart}`)
      .expect(200);

    expect(weekRes.body.data.weekStart).toBe(weekStart);
    expect(weekRes.body.data.days).toHaveLength(7);

    const firstItem = weekRes.body.data.days
      .flatMap((day: any) => day.items)
      .find((item: any) => item && item.id);

    expect(firstItem).toBeDefined();
    expect(firstItem.completed).toBe(false);

    const completeRes = await request(app.getHttpServer())
      .patch(`${baseSchedule}/items/${firstItem.id}/complete`)
      .send({ completed: true })
      .expect(200);

    expect(completeRes.body.data).toMatchObject({ itemId: firstItem.id, completed: true });

    const weekResAfterComplete = await request(app.getHttpServer())
      .get(`${baseSchedule}?weekStart=${weekStart}`)
      .expect(200);

    const updatedItem = weekResAfterComplete.body.data.days
      .flatMap((day: any) => day.items)
      .find((item: any) => item.id === firstItem.id);

    expect(updatedItem).toBeDefined();
    expect(updatedItem.completed).toBe(true);
  });

  it('rejects invalid weekStart parameter with a 400 response', async () => {
    await request(app.getHttpServer()).get(`${baseSchedule}?weekStart=invalid-date`).expect(400);
  });
});
