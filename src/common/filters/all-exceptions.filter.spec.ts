import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createHost = (response: { status: jest.Mock; json: jest.Mock }): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    }) as unknown as ArgumentsHost;

  it('returns success false with string HttpException message', () => {
    const filter = new AllExceptionsFilter();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    filter.catch(new BadRequestException('Email is already registered'), createHost(res));
    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email is already registered',
    });
  });

  it('joins validation message arrays with semicolons', () => {
    const filter = new AllExceptionsFilter();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    filter.catch(
      new BadRequestException({ message: ['a is invalid', 'b is invalid'] }),
      createHost(res),
    );
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'a is invalid; b is invalid',
    });
  });

  it('uses error field when message is missing', () => {
    const filter = new AllExceptionsFilter();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const ex = new HttpException({ error: 'Conflict' }, HttpStatus.CONFLICT);
    filter.catch(ex, createHost(res));
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Conflict',
    });
  });

  it('handles non-HttpException as internal error', () => {
    const filter = new AllExceptionsFilter();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    filter.catch(new Error('boom'), createHost(res));
    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
    });
  });
});
