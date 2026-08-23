import { ProjectController } from '@app/modules/project/project.controller';
import { ProjectService } from '@app/modules/project/project.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
