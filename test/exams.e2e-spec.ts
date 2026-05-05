import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Server } from 'http';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

interface ExamResponseItem {
  id: string;
}

describe('ExamsController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
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

    // ✅ FIX principal
    server = app.getHttpServer() as Server;
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

    const unique = `${Date.now()}-${Math.random()}`;

    const admin = await prisma.user.create({
      data: {
        full_name: 'Admin Test',
        email: `admin-${unique}@test.com`,
        password: 'hashed_password',
        phone_number: `phone-${unique}`,
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
    it('should list all exams with PUBLISHED status', async () => {
      const exam = await prisma.exam.create({
        data: {
          name: 'Test Exam',
          origin: 'ENEM',
          image_url: null,
          status: 'PUBLISHED',
        },
      });

      const response = await request(server)
        .get('/api/v1/admin/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);

      const exists = (response.body.data as ExamResponseItem[]).some((e) => e.id === exam.id);

      expect(exists).toBe(true);
    });

    it('should return 401 without JWT token', async () => {
      const response = await request(server).get('/api/v1/admin/exams');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/admin/exams/import', () => {
    it('should import exam from CSV', async () => {
      const csvContent = `exam_title,bank,exam_day,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,year
Simulado,ENEM,1,Álgebra,Equações,What is 2+2?,1,2,3,4,5,D,The answer is 4,2024`;

      const response = await request(server)
        .post('/api/v1/admin/exams/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), {
          filename: 'test.csv',
          contentType: 'text/csv',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DRAFT');
    });

    it('should reject file larger than 10 MB', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(server)
        .post('/api/v1/admin/exams/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', largeBuffer, {
          filename: 'large.csv',
          contentType: 'text/csv',
        });

      expect(response.status).toBe(413);
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

      const response = await request(server)
        .put(`/api/v1/admin/exams/${exam.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Updated Title');

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should reject publish attempt without image', async () => {
      const exam = await prisma.exam.create({
        data: {
          name: 'Test Exam',
          origin: 'ENEM',
          image_url: null,
          status: 'DRAFT',
        },
      });

      const response = await request(server)
        .put(`/api/v1/admin/exams/${exam.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('status', 'PUBLISHED');

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/admin/exams/:id', () => {
    it('should soft delete exam (set status to ARCHIVED)', async () => {
      const exam = await prisma.exam.create({
        data: {
          name: 'Test Exam',
          origin: 'ENEM',
          status: 'DRAFT',
        },
      });

      const response = await request(server)
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