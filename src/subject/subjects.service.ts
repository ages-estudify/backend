import { Injectable } from '@nestjs/common';
import { SubjectRepository } from './subjects.repository';


@Injectable()
export class SubjectService {
  constructor(private subjectRepository: SubjectRepository) {}

async findAllWithAnsweredByUser() {
   
  return this.subjectRepository.findAllWithAnsweredByUser();
 
}

async findAllPathsBySubject(id: string) {
 
  return this.subjectRepository.findAllPathsBySubject(id);
}
}