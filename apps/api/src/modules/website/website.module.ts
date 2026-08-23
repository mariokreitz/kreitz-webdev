import { WebsiteRepository } from '@app/database/repositories/website.repository';
import { WEBSITE_REPOSITORY } from '@app/modules/website/tokens/website.tokens';
import { WebsiteService } from '@app/modules/website/website.service';
import { Module } from '@nestjs/common';

import { WebsiteController } from './website.controller';

@Module({
  controllers: [WebsiteController],
  providers: [
    WebsiteService,
    {
      provide: WEBSITE_REPOSITORY,
      useClass: WebsiteRepository,
    },
  ],
  exports: [WebsiteService],
})
export class WebsiteModule {}
