import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { PrismaService } from './../src/prisma.service';

describe('AdminTopics (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let subjectId: string;
  const base = '/api/v1/admin/topics';
  const createdPathIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: randomUUID(), role: 'ADM' };
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
      data: { name: `e2e-subject-${randomUUID()}`, icon_url: '' },
    });
    subjectId = subject.id;
  });

  afterAll(async () => {
    if (createdPathIds.length) {
      await prisma.path.deleteMany({ where: { id: { in: createdPathIds } } });
    }
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => undefined);
    await app.close();
    await prisma.$disconnect();
  });

  it('rejects creation with an invalid payload (missing name, order = 0)', async () => {
    await request(app.getHttpServer()).post(base).send({ subjectId, order: 0 }).expect(400);
  });

  it('runs the full CRUD lifecycle with soft delete', async () => {
    const order = (Date.now() % 1_000_000) + 1;

    // CREATE
    const createRes = await request(app.getHttpServer())
      .post(base)
      .send({
        name: 'Trilha e2e',
        text: 'Descrição',
        order,
        subjectId,
      })
      .expect(201);

    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.message).toBe('Topic created successfully');
    const id: string = createRes.body.id;
    createdPathIds.push(id);

    // LIST (present)
    const listRes = await request(app.getHttpServer())
      .get(`${base}?subjectId=${subjectId}`)
      .expect(200);
    const created = listRes.body.data.find((t: any) => t.id === id);
    expect(created).toMatchObject({
      name: 'Trilha e2e',
      text: 'Descrição',
      iconUrl: null,
      order,
      subjectId,
    });

    // UPDATE
    const updateRes = await request(app.getHttpServer())
      .put(`${base}/${id}`)
      .send({ name: 'Trilha e2e editada' })
      .expect(200);
    expect(updateRes.body.message).toBe('Topic updated successfully');

    // DELETE (soft)
    const deleteRes = await request(app.getHttpServer()).delete(`${base}/${id}`).expect(200);
    expect(deleteRes.body.message).toBe('Topic deleted successfully');

    // LIST (absent from default list after soft delete)
    const afterRes = await request(app.getHttpServer())
      .get(`${base}?subjectId=${subjectId}`)
      .expect(200);
    expect(afterRes.body.data.some((t: any) => t.id === id)).toBe(false);

    // LIST disabled (?enable=false) -> the soft-deleted topic shows up
    const disabledRes = await request(app.getHttpServer())
      .get(`${base}?subjectId=${subjectId}&enable=false`)
      .expect(200);
    expect(disabledRes.body.data.some((t: any) => t.id === id)).toBe(true);

    // RE-ENABLE via update
    const reenableRes = await request(app.getHttpServer())
      .put(`${base}/${id}`)
      .send({ enable: true })
      .expect(200);
    expect(reenableRes.body.message).toBe('Topic updated successfully');

    // LIST default -> topic is back
    const restoredRes = await request(app.getHttpServer())
      .get(`${base}?subjectId=${subjectId}`)
      .expect(200);
    expect(restoredRes.body.data.some((t: any) => t.id === id)).toBe(true);
  });

  it('returns 404 when updating a non-existent topic', async () => {
    await request(app.getHttpServer())
      .put(`${base}/${randomUUID()}`)
      .send({ name: 'x' })
      .expect(404);
  });
});
