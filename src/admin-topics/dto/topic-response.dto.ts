import { ApiProperty } from '@nestjs/swagger';

export class TopicDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Álgebra Básica' })
  name!: string;

  @ApiProperty({ example: 'Introdução à álgebra...' })
  text!: string;

  @ApiProperty({ example: 'https://cdn.com/icon.png', nullable: true, type: String })
  iconUrl!: string | null;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  subjectId!: string;
}

export class ListTopicsResponseDto {
  @ApiProperty({ type: [TopicDto] })
  data!: TopicDto[];
}

export class CreateTopicResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Topic created successfully' })
  message!: string;
}

export class UpdateTopicResponseDto {
  @ApiProperty({ example: 'Topic updated successfully' })
  message!: string;
}

export class DeleteTopicResponseDto {
  @ApiProperty({ example: 'Topic deleted successfully' })
  message!: string;
}
