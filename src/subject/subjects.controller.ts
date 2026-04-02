import { Controller, Get, Param } from '@nestjs/common';
import { SubjectService } from './subjects.service';


@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  async subjectListing() {
    const data = await this.subjectService.findAllWithAnsweredByUser();

    return {
      data
    }
  }


  @Get(':id/topic')
  async PathsBySubject(@Param('id') id: string) {
    const data = await this.subjectService.findAllPathsBySubject(id);

     return{
      data
    }
  }


}
