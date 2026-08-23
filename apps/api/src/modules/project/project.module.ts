import { ProjectRepository } from '@app/database/repositories/project.repository';
import { Module } from '@nestjs/common';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { PROJECT_REPOSITORY } from './tokens/project.tokens';

@Module({
  controllers: [ProjectController],

  providers: [
    ProjectService,

    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },
  ],

  exports: [ProjectService, PROJECT_REPOSITORY],
})
export class ProjectModule {}
