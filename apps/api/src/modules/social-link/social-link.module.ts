import { SocialLinkRepository } from '@app/database/repositories/social-link.repository';
import { WebsiteModule } from '@app/modules/website';
import { Module } from '@nestjs/common';
import { SocialLinkController } from './social-link.controller';
import { SocialLinkService } from './social-link.service';
import { SOCIAL_LINK_REPOSITORY } from './tokens/social-link.tokens';

@Module({
  imports: [WebsiteModule],
  controllers: [SocialLinkController],
  providers: [
    SocialLinkService,

    {
      provide: SOCIAL_LINK_REPOSITORY,
      useClass: SocialLinkRepository,
    },
  ],
  exports: [SocialLinkService, SOCIAL_LINK_REPOSITORY],
})
export class SocialLinkModule {}
