import { Global, Module } from '@nestjs/common';
import { ExamMediaService } from './exam-media.service';
import { QuestionMediaService } from './question-media.service';
import { S3Service } from './s3.service';

@Global()
@Module({
  providers: [S3Service, QuestionMediaService, ExamMediaService],
  exports: [S3Service, QuestionMediaService, ExamMediaService],
})
export class StorageModule {}
