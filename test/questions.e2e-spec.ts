import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('QuestionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://postgres:postgres@localhost:5432/backend?schema=public';
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  beforeEach(async () => {
    await prisma.answer.deleteMany();
    await prisma.alternative.deleteMany();
    await prisma.question.deleteMany();
    await prisma.examDay.deleteMany();
    await prisma.attemptDay.deleteMany();
    await prisma.attempt.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.path.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
      data: {
        full_name: 'Admin Test',
        email: `admin-${Date.now()}@test.com`,
        password: 'hashed_password',
        phone_number: `1234567890-${Date.now()}-${Math.random()}`,
        role: Role.ADM,
      },
    });

    adminToken = jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const subject = await prisma.subject.create({
      data: {
        name: 'Matemática',
        icon_url: 'https://example.com/math.png',
      },
    });

    await prisma.path.create({
      data: {
        name: 'Álgebra',
        text: 'Learn algebra',
        icon_url: 'https://example.com/alg.png',
        schedule_position: 1,
        trail_position: 1,
        subject_id: subject.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/v1/admin/exams', () => {
    it('should list all exams with DRAFT status', async () => {
      const exam = await prisma.exam.create({
        data: {
          name: 'Test Exam',
          origin: 'ENEM',
          image_url: null,
          status: 'DRAFT',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(
        response.body.data.some((e: any) => e.id === exam.id),
      ).toBe(true);
    });

    it('should return 401 without JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/exams');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/admin/exams/:id', () => {
    it('should update exam title', async () => {
      const exam = await prisma.exam.create({
        data: {
          name: 'Original Title',
          origin: 'ENEM',
          status: 'DRAFT',
        },
      });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/admin/exams/${exam.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Updated Title');

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/v1/admin/exams/:id', () => {
    it('should soft delete exam (set status to ARCHIVED)', async () => {
      const exam = await prisma.exam.create({
        data: {
          name: 'Delete Me',
          origin: 'ENEM',
          status: 'DRAFT',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/admin/exams/${exam.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      const archived = await prisma.exam.findUnique({
        where: { id: exam.id },
      });

      expect(archived?.status).toBe('ARCHIVED');
    });
  });
});