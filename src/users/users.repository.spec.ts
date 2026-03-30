import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  let repo: UsersRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new UsersRepository(prisma as unknown as PrismaService);
  });

  it('findByEmail delegates to prisma.user.findUnique', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await repo.findByEmail('a@b.com');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });

  it('findByPhone delegates to prisma.user.findUnique on phone_number', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await repo.findByPhone('51999999999');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { phone_number: '51999999999' } });
  });

  it('create delegates to prisma.user.create', async () => {
    const created = {
      id: 'id',
      full_name: 'x',
      email: 'x@x.com',
      password: 'h',
      phone_number: '1',
      role: Role.USER,
      plan_end_date: null,
      birth_date: null,
      streak: null,
      coins: null,
      createdAt: new Date(),
      enable: true,
      desired_course: null,
      desired_exam: null,
      last_active: null,
    };
    prisma.user.create.mockResolvedValue(created);
    const data = {
      full_name: 'x',
      email: 'x@x.com',
      password: 'h',
      phone_number: '1',
      role: Role.USER,
    };
    await expect(repo.create(data)).resolves.toEqual(created);
    expect(prisma.user.create).toHaveBeenCalledWith({ data });
  });
});
