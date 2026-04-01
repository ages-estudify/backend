import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as jwt from 'jsonwebtoken';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid token', () => {
      const payload = { userId: '3bbddee4-cf1f-4cb4-b74c-7df03193e64b', role: 'USER' };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret');

      const request = { headers: { authorization: `Bearer ${token}` }, user: {} };
      const mockContext = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(request.user).toEqual({ userId: payload.userId });
    });

    it('should throw UnauthorizedException for missing token', () => {
      const request = { headers: {}, user: {} };
      const mockContext = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token format', () => {
      const request = { headers: { authorization: 'invalid-format' }, user: {} };
      const mockContext = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });
  });
});
