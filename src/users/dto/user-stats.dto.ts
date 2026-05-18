import { ApiProperty } from '@nestjs/swagger'

export class UserStatsDto {
    @ApiProperty({ type: () => UserStatsDataDto })
    data: UserStatsDataDto
}

export class UserStatsDataDto {
    @ApiProperty({ type: () => OverviewDto })
    overview: OverviewDto

    @ApiProperty({ type: () => LevelDto })
    level: LevelDto

    @ApiProperty({ type: () => CompletedTopicsDto })
    completedTopics: CompletedTopicsDto

    @ApiProperty({
        example: 156,
    })
    stars: number

    @ApiProperty({
        example: 10,
    })
    streak: number

    @ApiProperty({
        type: () => [SimuladoDto],
    })
    simulados: SimuladoDto[]

    @ApiProperty({
        type: () => [AccuracyBySubjectDto],
    })
    accuracyBySubject: AccuracyBySubjectDto[]
}

export class OverviewDto {
    @ApiProperty({
        example: 156,
    })
    totalAnswered: number

    @ApiProperty({
        example: 42,
    })
    totalCorrect: number

    @ApiProperty({
        example: 26.9,
    })
    accuracyPercentage: number
}

export class LevelDto {
    @ApiProperty({
        example: 6,
    })
    current: number

    @ApiProperty({
        example: 10,
    })
    max: number
}

export class CompletedTopicsDto {
    @ApiProperty({
        example: 2,
    })
    completed: number

    @ApiProperty({
        example: 18,
    })
    total: number
}

export class SimuladoDto {
    @ApiProperty({
        example: '3ff4b29c-ee63-4757-8415-e5627b10c86c',
    })
    attemptId: string

    @ApiProperty({
        example: 'Simulado ENEM | Janeiro',
    })
    examName: string

    @ApiProperty({
        example: '2026-01-15',
        nullable: true,
    })
    date: string | null

    @ApiProperty({
        type: () => [SimuladoDayDto],
    })
    days: SimuladoDayDto[]
}

export class SimuladoDayDto {
    @ApiProperty({
        example: 1,
    })
    day: number

    @ApiProperty({
        example: 'Dia 1',
    })
    label: string

    @ApiProperty({
        example: 15,
    })
    correct: number

    @ApiProperty({
        example: 45,
    })
    total: number

    @ApiProperty({
        example: 33.3,
    })
    scorePercentage: number
}

export class AccuracyBySubjectDto {
    @ApiProperty({
        example: 'uuid',
    })
    subjectId: string

    @ApiProperty({
        example: 'Matemática',
    })
    subjectName: string

    @ApiProperty({
        example: 10,
    })
    correct: number

    @ApiProperty({
        example: 24,
    })
    totalAnswered: number
}