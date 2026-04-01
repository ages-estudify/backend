import { Injectable } from '@nestjs/common';
import { UserResponse, UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async findAll(): Promise<UserResponse[]> {
    return this.users.findMany();
  }

  async findOne(id: string): Promise<UserResponse | null> {
    return this.users.findUniqueById(id);
  }
}
