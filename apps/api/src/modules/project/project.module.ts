import { ProjectRepository } from '@app/database/repositories/project.repository';
import { WebsiteProjectRepository } from '@app/database/repositories/website-project.repository';
// WHY: importing the website-project barrel here would create a circular module load (WebsiteProjectModule already imports ProjectModule); this leaf import lets ProjectModule provide its own WEBSITE_PROJECT_REPOSITORY instance for cache invalidation without depending on WebsiteProjectModule.
import { WEBSITE_PROJECT_REPOSITORY } from '@app/modules/website-project/tokens/website-project.tokens';
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

    {
      provide: WEBSITE_PROJECT_REPOSITORY,
      useClass: WebsiteProjectRepository,
    },
  ],

  exports: [ProjectService, PROJECT_REPOSITORY],
})
export class ProjectModule {}
