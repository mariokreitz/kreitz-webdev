import { WebsiteProjectRepository } from '@app/database/repositories/website-project.repository';
import { ProjectModule } from '@app/modules/project/project.module';
import { WebsiteModule } from '@app/modules/website/website.module';
import { Module } from '@nestjs/common';
import { WEBSITE_PROJECT_REPOSITORY } from './tokens/website-project.tokens';

import { WebsiteProjectController } from './website-project.controller';
import { WebsiteProjectService } from './website-project.service';

@Module({
  imports: [WebsiteModule, ProjectModule],
  controllers: [WebsiteProjectController],
  providers: [
    WebsiteProjectService,
    {
      provide: WEBSITE_PROJECT_REPOSITORY,
      useClass: WebsiteProjectRepository,
    },
  ],
  exports: [WebsiteProjectService, WEBSITE_PROJECT_REPOSITORY],
})
export class WebsiteProjectModule {}
