import { WebsiteTokenRepository } from '@app/database/repositories/website-token.repository';
import { WebsiteModule } from '@app/modules/website';
import { Module } from '@nestjs/common';
import { WEBSITE_TOKEN_REPOSITORY } from './tokens/website-token.tokens';

import { WebsiteTokenController } from './website-token.controller';
import { WebsiteTokenService } from './website-token.service';

@Module({
  imports: [WebsiteModule],
  controllers: [WebsiteTokenController],
  providers: [
    WebsiteTokenService,
    {
      provide: WEBSITE_TOKEN_REPOSITORY,
      useClass: WebsiteTokenRepository,
    },
  ],
  exports: [WebsiteTokenService, WEBSITE_TOKEN_REPOSITORY, WebsiteModule],
})
export class WebsiteTokenModule {}
