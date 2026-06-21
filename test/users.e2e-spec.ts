import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';

describe('Users e2e flows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentUserId: string;
  let currentUserRole: 'USER' | 'ADM' = 'USER';
  let createdUserId: string;
  let adminUserId: string;
  const baseUsers = '/api/v1/users';
  const createdAdditionalUserIds: string[] = [];

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

    adminUserId = randomUUID();
    currentUserId = adminUserId;
    currentUserRole = 'ADM';

    await prisma.user.create({
      data: {
        id: adminUserId,
        full_name: `e2e admin user ${randomUUID()}`,
        email: `e2e-admin-${randomUUID()}@example.com`,
        password: 'e2e-password',
        phone_number: `+1555${Math.floor(Math.random() * 1_000_000_000)
          .toString()
          .padStart(9, '0')}`,
        role: 'ADM',
        enable: true,
        plan_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });
  });

  beforeEach(async () => {
    createdUserId = randomUUID();
    currentUserId = createdUserId;
    currentUserRole = 'USER';

    await prisma.user.create({
      data: {
        id: createdUserId,
        full_name: `e2e user ${randomUUID()}`,
        email: `e2e-user-${randomUUID()}@example.com`,
        password: 'e2e-password',
        phone_number: `+1555${Math.floor(Math.random() * 1_000_000_000)
          .toString()
          .padStart(9, '0')}`,
        role: 'USER',
        enable: true,
        plan_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        coins: 2,
        streak: 3,
        last_active: new Date(),
      },
    });
  });

  afterEach(async () => {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
    if (createdAdditionalUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdAdditionalUserIds } } });
      createdAdditionalUserIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: adminUserId } }).catch(() => undefined);
    await app.close();
    await prisma.$disconnect();
  });

  it('allows an admin to create a new user and list users', async () => {
    currentUserId = adminUserId;
    currentUserRole = 'ADM';

    const newUserEmail = `e2e-created-${randomUUID()}@example.com`;
    const newUserPhone = `+1555${Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, '0')}`;

    const createRes = await request(app.getHttpServer())
      .post(baseUsers)
      .send({
        fullName: 'Novo Usuário',
        email: newUserEmail,
        password: 'Password123!',
        phone: newUserPhone,
        birthDate: '2000-01-01',
      })
      .expect(201);

    expect(createRes.body.email).toBe(newUserEmail);
    expect(createRes.body.full_name).toBe('Novo Usuário');
    expect(createRes.body).not.toHaveProperty('password');
    createdAdditionalUserIds.push(createRes.body.id);

    const listRes = await request(app.getHttpServer()).get(baseUsers).expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((user: any) => user.id === createRes.body.id)).toBe(true);
  });

  it('returns the current user profile and coins/streak values', async () => {
    const meRes = await request(app.getHttpServer()).get(`${baseUsers}/me`).expect(200);
    expect(meRes.body).toMatchObject({
      plan_end_date: expect.any(String),
      onboarding_completed: false,
      profile_picture_url: null,
    });

    const coinsRes = await request(app.getHttpServer()).get(`${baseUsers}/me/coins`).expect(200);
    expect(coinsRes.body.data.coins).toBe(2);

    const streakRes = await request(app.getHttpServer()).get(`${baseUsers}/streak`).expect(200);
    expect(streakRes.body.streakDays).toBe(3);
    expect(streakRes.body.streakActive).toBe(true);
  });

  it('allows a user to update their own profile', async () => {
    const updateRes = await request(app.getHttpServer())
      .put(`${baseUsers}/${createdUserId}`)
      .send({ fullName: 'Usuário Atualizado', desiredCourse: 'Engenharia' })
      .expect(200);

    expect(updateRes.body.full_name).toBe('Usuário Atualizado');
    expect(updateRes.body.desired_course).toBe('Engenharia');

    const user = await prisma.user.findUnique({
      where: { id: createdUserId },
      select: { full_name: true, desired_course: true },
    });

    expect(user).toEqual({ full_name: 'Usuário Atualizado', desired_course: 'Engenharia' });
  });

  it('allows an admin to disable a user account', async () => {
    currentUserId = adminUserId;
    currentUserRole = 'ADM';

    await request(app.getHttpServer()).delete(`${baseUsers}/${createdUserId}`).expect(204);

    const disabledUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      select: { enable: true },
    });
    expect(disabledUser?.enable).toBe(false);
  });
});
