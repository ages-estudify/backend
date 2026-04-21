import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('ExamsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let examId: string;
  let subjectId: string;
  let pathId: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://postgres:postgres@localhost:5433/backend?schema=public';
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create admin user and get token
    const admin = await prisma.user.create({
      data: {
        full_name: 'Admin Test',
        email: 'admin-test@test.com',
        password: 'hashed_password',
        phone_number: '1234567890',
        role: Role.ADM,
      },
    });

    adminToken = jwtService.sign({
      sub: admin.id,
      email: admin.email,role: admin.role,
    });

    // Create test data
    const subject = await prisma.subject.create({
      data: {
        name: 'Matemática',
        icon_url: 'https://example.com/math.png',
      },
    });
    subjectId = subject.id;

    const path = await prisma.path.create({
      data: {
        name: 'Álgebra',
        text: 'Learn algebra',
        icon_url: 'https://example.com/alg.png',
        schedule_position: 1,
        trail_position: 1,
        subject_id: subjectId,
      },
    });
    pathId = path.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.answer.deleteMany();
    await prisma.alternative.deleteMany();
    await prisma.question.deleteMany();
    await prisma.examDay.deleteMany();
    await prisma.attempt.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.path.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });

  describe('GET /api/v1/admin/exams', () => {
    it('should list all exams with DRAFT status', async () => {
      // First create an exam
      const exam = await prisma.exam.create({
        data: {
          name: 'Test Exam',
          origin: 'ENEM',
          image_url: null,
          status: 'DRAFT',
        },
      });
      examId = exam.id;

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/exams')
        .set('Authorization', \Bearer \\);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.some((e: any) => e.id === examId)).toBe(true);
    });

    it('should return 401 without JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/exams');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/admin/exams/import', () => {
    it('should import exam from CSV', async () => {
      const csvContent = \exam_title,bank,exam_day,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,year
Test Simulado,ENEM,1,Matemática,Álgebra,What is 2+2?,A,B,C,D,E,B,The answer is 4,2024\;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/exams/import')
        .set('Authorization', \Bearer \\)
        .field('file', Buffer.from(csvContent), 'test.csv');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DRAFT');
    });

    it('should reject file larger than 10 MB', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/exams/import')
        .set('Authorization', \Bearer \\)
        .attach('file', largeBuffer, 'large.csv');

      expect(response.status).toBe(413);
    });
  });

  describe('PUT /api/v1/admin/exams/:id', () => {
    it('should update exam title', async () => {
      const response = await request(app.getHttpServer())
        .put(\/api/v1/admin/exams/\\)
        .set('Authorization', \Bearer \\)
        .field('title', 'Updated Title');

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should reject publish attempt without image', async () => {
      const response = await request(app.getHttpServer())
        .put(\/api/v1/admin/exams/\\)
        .set('Authorization', \Bearer \\)
        .field('status', 'PUBLISHED');

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/admin/exams/:id', () => {
    it('should soft delete exam (set status to ARCHIVED)', async () => {
      const response = await request(app.getHttpServer())
        .delete(\/api/v1/admin/exams/\\)
        .set('Authorization', \Bearer \\);

      expect(response.status).toBe(204);

      // Verify exam is archived
      const archived = await prisma.exam.findUnique({ where: { id: examId } });
      expect(archived?.status).toBe('ARCHIVED');
    });
  });
});
