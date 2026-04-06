import { Test } from '@nestjs/testing';
import { QuestionsModule } from './questions.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('QuestionsModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [QuestionsModule],
    }).compile();

    expect(module).toBeDefined();

    const controller = module.get<QuestionsController>(QuestionsController);
    expect(controller).toBeDefined();

    const service = module.get<QuestionsService>(QuestionsService);
    expect(service).toBeDefined();

    const repository = module.get<QuestionsRepository>(QuestionsRepository);
    expect(repository).toBeDefined();

    const prisma = module.get<PrismaService>(PrismaService);
    expect(prisma).toBeDefined();

    const guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    expect(guard).toBeDefined();
  });
});
