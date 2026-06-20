import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';

describe('Schedule e2e flows', () => {
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
        name: `e2e-schedule-subject-${randomUUID()}`,
        icon_url: 'https://example.com/icon.png',
      },
    });
    subjectId = subject.id;
    createdSubjectIds.push(subjectId);

    const schedulePosition = Math.floor(Math.random() * 1_000_000) + 1_000_000;
    const path = await prisma.path.create({
      data: {
        name: `e2e-schedule-path-${randomUUID()}`,
        text: 'E2E schedule path',
        icon_key: 'e2e-path-icon',
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
        full_name: `e2e schedule user ${randomUUID()}`,
        email: `e2e-schedule-${randomUUID()}@example.com`,
        password: 'e2e-password',
        phone_number: `+1555${Math.floor(Math.random() * 1_000_000_000)
          .toString()
          .padStart(9, '0')}`,
        role: 'USER',
        enable: true,
        onboarding_completed: false,
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

  it('rejects schedule creation before onboarding is completed', async () => {
    await request(app.getHttpServer()).post(baseSchedule).expect(409);
  });

  it('creates an initial schedule after onboarding and returns 200 on second creation', async () => {
    await request(app.getHttpServer())
      .post(baseOnboarding)
      .send({
        studyHours: {
          MONDAY: [9],
          FRIDAY: [18],
        },
      })
      .expect(204);

    const firstRes = await request(app.getHttpServer()).post(baseSchedule).expect(201);
    expect(firstRes.body.data.generatedItems).toBeGreaterThan(0);
    expect(firstRes.body.data.firstDate).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
    expect(firstRes.body.data.lastDate).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

    const secondRes = await request(app.getHttpServer()).post(baseSchedule);
    expect([200, 201]).toContain(secondRes.status);
    expect(secondRes.body.data.generatedItems).toBeGreaterThanOrEqual(0);
    expect(secondRes.body.data.firstDate).toBe(firstRes.body.data.firstDate);
    expect(secondRes.body.data.lastDate).toBe(firstRes.body.data.lastDate);
  });

  it('marks a schedule item as completed and then uncompleted', async () => {
    await request(app.getHttpServer())
      .post(baseOnboarding)
      .send({
        studyHours: {
          TUESDAY: [10],
        },
      })
      .expect(204);

    const scheduleRes = await request(app.getHttpServer()).post(baseSchedule).expect(201);
    const weekStart = scheduleRes.body.data.firstDate;

    const weekRes = await request(app.getHttpServer())
      .get(`${baseSchedule}?weekStart=${weekStart}`)
      .expect(200);

    const firstItem = weekRes.body.data.days
      .flatMap((day: any) => day.items)
      .find((item: any) => item.id);
    expect(firstItem).toBeDefined();
    expect(firstItem.completed).toBe(false);

    const completeRes = await request(app.getHttpServer())
      .patch(`${baseSchedule}/items/${firstItem.id}/complete`)
      .send({ completed: true })
      .expect(200);

    expect(completeRes.body.data).toEqual({ itemId: firstItem.id, completed: true });

    const uncompleteRes = await request(app.getHttpServer())
      .patch(`${baseSchedule}/items/${firstItem.id}/complete`)
      .send({ completed: false })
      .expect(200);

    expect(uncompleteRes.body.data).toEqual({ itemId: firstItem.id, completed: false });
  });

  it('returns 404 when trying to update a non-existing schedule item', async () => {
    await request(app.getHttpServer())
      .patch(`${baseSchedule}/items/00000000-0000-0000-0000-000000000000/complete`)
      .send({ completed: true })
      .expect(404);
  });
});
