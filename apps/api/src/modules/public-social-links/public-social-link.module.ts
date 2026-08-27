import { redisConfig } from '@app/config';
import { PublicSocialLinkRepository } from '@app/database/repositories/public-social-link.repository';
import { WebsiteDomainModule } from '@app/modules/website-domain';
import { WebsiteTokenModule } from '@app/modules/website-token';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PublicSocialLinkController } from './public-social-link.controller';
import { PublicSocialLinkService } from './public-social-link.service';
import { PUBLIC_SOCIAL_LINK_REPOSITORY } from './tokens/public-social-link.tokens';

@Module({
  imports: [WebsiteDomainModule, WebsiteTokenModule, ConfigModule.forFeature(redisConfig)],
  controllers: [PublicSocialLinkController],
  providers: [
    PublicSocialLinkService,

    {
      provide: PUBLIC_SOCIAL_LINK_REPOSITORY,
      useClass: PublicSocialLinkRepository,
    },
  ],
})
export class PublicSocialLinkModule {}
