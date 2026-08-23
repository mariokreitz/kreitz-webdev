import { PublicProjectRepository } from '@app/database/repositories/public-project.repository';
import { WebsiteDomainModule } from '@app/modules/website-domain/website-domain.module';
import { WebsiteTokenModule } from '@app/modules/website-token/website-token.module';
import { Module } from '@nestjs/common';

import { PublicProjectController } from './public-project.controller';
import { PublicProjectService } from './public-project.service';
import { PUBLIC_PROJECT_REPOSITORY } from './tokens/public-project.tokens';

@Module({
  imports: [WebsiteDomainModule, WebsiteTokenModule],
  controllers: [PublicProjectController],
  providers: [
    PublicProjectService,

    {
      provide: PUBLIC_PROJECT_REPOSITORY,
      useClass: PublicProjectRepository,
    },
  ],
})
export class PublicProjectModule {}
