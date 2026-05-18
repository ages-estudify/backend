import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RefreshTokenRepository } from '../users/refresh-token.repository';
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
    const refreshRepoStub = {
      create: jest.fn(),
      findValidByHashWithUser: jest.fn(),
      deleteById: jest.fn(),
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
      .overrideProvider(RefreshTokenRepository)
      .useValue(refreshRepoStub)
      .compile();

    expect(moduleRef.get(AuthService)).toBeDefined();
  });
});
