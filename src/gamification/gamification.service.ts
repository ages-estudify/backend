import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { EarnCoinsDto } from './dto/earn-coins.dto';
import { EarnCoinsResponseDto } from './dto/earn-coins.response.dto';

@Injectable()
export class GamificationService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async earnCoins(dto: EarnCoinsDto): Promise<EarnCoinsResponseDto> {
    if (!dto.isCorrect || dto.isSimulated) {
      const totalCoins = await this.getTotalCoins(dto.userId);
      return { coinsEarned: 0, totalCoins };
    }

    const updatedUser = await this.usersRepository.incrementCoins(dto.userId, 1);
    return { coinsEarned: 1, totalCoins: updatedUser.coins ?? 0 };
  }

  private async getTotalCoins(userId: string): Promise<number> {
    const user = await this.usersRepository.findUniqueById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.coins ?? 0;
  }
}
