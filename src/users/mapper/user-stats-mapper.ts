import {
  AccuracyBySubjectDto,
  CompletedTopicsDto,
  LevelDto,
  OverviewDto,
  SimuladoDto,
  UserStatsDto,
} from '../dto/user-stats.dto';

export class UserStatsMapper {
  static toDto(
    questionStats: OverviewDto,
    level: LevelDto,
    starsStats,
    topics: CompletedTopicsDto,
    subject: AccuracyBySubjectDto[],
    lastAttempts: SimuladoDto[],
  ): UserStatsDto {
    return {
      data: {
        overview: questionStats,

        level: level,

        completedTopics: topics,

        stars: starsStats.coins,

        streak: starsStats.streak,

        simulados: lastAttempts,

        accuracyBySubject: subject,
      },
    };
  }
}
