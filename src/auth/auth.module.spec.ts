import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { UsersRepository } from '../users/users.repository';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

describe('AuthModule', () => {
  it('compiles and exposes AuthService', async () => {
    const usersRepoStub = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        AuthModule,
      ],
    })
      .overrideProvider(UsersRepository)
      .useValue(usersRepoStub)
      .compile();

    expect(moduleRef.get(AuthService)).toBeDefined();
  });
});
