import { AccuracyBySubjectDto, CompletedTopicsDto, LevelDto, OverviewDto, SimuladoDto, UserStatsDto } from "../dto/user-stats.dto"
import { getMaxLevel } from "../utils/levels"

export class UserStatsMapper {
    static toDto(questionStats, Level: number, starsStats, topics, subject, lastAttempts): UserStatsDto {
        return {
            data: {
                overview: this.toOverviewDto(questionStats),

                level: this.toLevelDto(Level),

                completedTopics: this.toCompletedTopicsDto(topics),

                stars: starsStats.coins,

                streak: starsStats.streak,

                simulados: this.toSimuladosDto(lastAttempts),

                accuracyBySubject: this.toAccuracyBySubjectDto(subject),
            },
        }
    }

    private static toOverviewDto(questionsStats): OverviewDto {
        return {
            totalAnswered: questionsStats.total,

            totalCorrect: questionsStats.correctAnswer,

            accuracyPercentage: questionsStats.percentage,
        }
    }


    private static toLevelDto(Level: number): LevelDto {
        return {
            current: Level,
            max: getMaxLevel(),
        }
    }

    private static toCompletedTopicsDto(topics): CompletedTopicsDto {
        return {
            completed: topics.completed,

            total: topics.totalTopics,
        }
    }

    private static toSimuladosDto(lastAttempts: any[]): SimuladoDto[] {
        return lastAttempts.map(attempt => ({
            attemptId: attempt.attemptId,

            examName: attempt.examName,

            date: attempt.date,

            days: attempt.days.map(day => ({
                day: day.day,

                label: day.label,

                correct: day.correct,

                total: day.total,

                scorePercentage: day.scorePercentage,
            })),
        }))
    }

    private static toAccuracyBySubjectDto(subjects: any[]): AccuracyBySubjectDto[] {
        return subjects.map(subjects => ({
            subjectId: subjects.id,

            subjectName: subjects.name,

            correct: subjects.correct,

            totalAnswered: subjects.total,
        }))
    }

}
