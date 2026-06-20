import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';
import { PlanType } from '@prisma/client';

describe('Subscriptions e2e flows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentUserId: string;
  let currentUserRole: 'USER' | 'ADM' = 'USER';
  let createdUserId: string;
  const baseSubscriptions = '/api/v1/subscriptions';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: currentUserId, role: currentUserRole };
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
    currentUserRole = 'USER';

    await prisma.user.create({
      data: {
        id: createdUserId,
        full_name: `e2e subscription user ${randomUUID()}`,
        email: `e2e-subscription-${randomUUID()}@example.com`,
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
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
    await prisma.subscription.deleteMany({ where: { user_id: createdUserId } });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('activates a TRIMESTRAL subscription and updates the user plan_end_date', async () => {
    const response = await request(app.getHttpServer())
      .post(baseSubscriptions)
      .send({ planType: PlanType.TRIMESTRAL })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        planActive: true,
        planExpirationDate: expect.any(String),
        token: expect.any(String),
        refreshToken: expect.any(String),
      },
    });

    const [subscription, user] = await Promise.all([
      prisma.subscription.findFirst({ where: { user_id: createdUserId } }),
      prisma.user.findUnique({ where: { id: createdUserId }, select: { plan_end_date: true } }),
    ]);

    expect(subscription).toBeTruthy();
    expect(subscription?.plan_type).toBe(PlanType.TRIMESTRAL);
    expect(user?.plan_end_date).toBeTruthy();
    expect(new Date(user!.plan_end_date).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns 400 when planType is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post(baseSubscriptions)
      .send({ planType: 'MONTHLY' })
      .expect(400);

    expect(response.body.message).toContain('planType must be TRIMESTRAL or ANUAL');
  });

  it('returns 404 when the authenticated user does not exist', async () => {
    currentUserId = randomUUID();
    currentUserRole = 'USER';

    await request(app.getHttpServer())
      .post(baseSubscriptions)
      .send({ planType: PlanType.ANUAL })
      .expect(404);
  });
});
