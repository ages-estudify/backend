import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';

describe('Onboarding e2e flows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentUserId: string;
  let createdUserId: string;
  const baseOnboarding = '/api/v1/onboarding';

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
  });

  beforeEach(async () => {
    createdUserId = randomUUID();
    currentUserId = createdUserId;

    await prisma.user.create({
      data: {
        id: createdUserId,
        full_name: `e2e onboarding user ${randomUUID()}`,
        email: `e2e-onboarding-${randomUUID()}@example.com`,
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
      await prisma.studyDay.deleteMany({ where: { user_id: createdUserId } });
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('completes onboarding with study hours and creates study day entries', async () => {
    await request(app.getHttpServer())
      .post(baseOnboarding)
      .send({
        desiredCourse: 'Engenharia',
        desiredUniversity: 'USP',
        preferredLanguage: 'ENGLISH',
        studyHours: {
          MONDAY: [18, 20],
          FRIDAY: [15],
        },
      })
      .expect(204);

    const user = await prisma.user.findUnique({
      where: { id: createdUserId },
      select: {
        onboarding_completed: true,
        desired_course: true,
        desired_university: true,
        preferred_language: true,
      },
    });

    expect(user).toMatchObject({
      onboarding_completed: true,
      desired_course: 'Engenharia',
      desired_university: 'USP',
      preferred_language: 'ENGLISH',
    });

    const studyDays = await prisma.studyDay.findMany({ where: { user_id: createdUserId } });
    expect(studyDays).toHaveLength(3);
    expect(studyDays.map((item) => ({ day: item.day, hour: item.hour }))).toEqual(
      expect.arrayContaining([
        { day: 'FRIDAY', hour: 15 },
        { day: 'MONDAY', hour: 18 },
        { day: 'MONDAY', hour: 20 },
      ]),
    );
  });

  it('completes onboarding without study hours and does not create study day entries', async () => {
    await request(app.getHttpServer())
      .post(baseOnboarding)
      .send({
        desiredCourse: 'Medicina',
        preferredLanguage: 'SPANISH',
      })
      .expect(204);

    const user = await prisma.user.findUnique({
      where: { id: createdUserId },
      select: { onboarding_completed: true, desired_course: true, preferred_language: true },
    });

    expect(user).toMatchObject({
      onboarding_completed: true,
      desired_course: 'Medicina',
      preferred_language: 'SPANISH',
    });

    const studyDays = await prisma.studyDay.findMany({ where: { user_id: createdUserId } });
    expect(studyDays).toHaveLength(0);
  });

  it('rejects invalid onboarding payload with a 400 response', async () => {
    await request(app.getHttpServer())
      .post(baseOnboarding)
      .send({ studyHours: { INVALID_DAY: [10] } })
      .expect(400);
  });

  it('rejects invalid preferredLanguage with a 400 response', async () => {
    await request(app.getHttpServer())
      .post(baseOnboarding)
      .send({ preferredLanguage: 'INVALID_LANGUAGE' })
      .expect(400);
  });
});
