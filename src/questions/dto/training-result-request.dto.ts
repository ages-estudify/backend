import { IsArray, ArrayMinSize, ArrayMaxSize, IsUUID } from 'class-validator';

export class TrainingResultRequest {
  @IsArray({ message: 'questionsIds deve ser um array' })
  @ArrayMinSize(1, { message: 'questionsIds deve ter pelo menos 1 elemento' })
  @ArrayMaxSize(50, { message: 'questionsIds não pode ter mais de 50 elementos' })
  @IsUUID('4', { each: true, message: 'Cada questionId deve ser um UUID válido' })
  questionsIds!: string[];
}
