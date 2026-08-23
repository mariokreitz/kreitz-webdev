import { redisConfig } from '@app/config';
import { PublicProjectRepository } from '@app/database/repositories/public-project.repository';
import { WebsiteDomainModule } from '@app/modules/website-domain';
import { WebsiteTokenModule } from '@app/modules/website-token';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PublicProjectController } from './public-project.controller';
import { PublicProjectService } from './public-project.service';
import { PUBLIC_PROJECT_REPOSITORY } from './tokens/public-project.tokens';

@Module({
  imports: [WebsiteDomainModule, WebsiteTokenModule, ConfigModule.forFeature(redisConfig)],
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
