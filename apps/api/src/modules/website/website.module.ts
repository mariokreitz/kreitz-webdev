import { WebsiteRepository } from '@app/database/repositories/website.repository';
import { Module } from '@nestjs/common';

import { WebsiteController } from './website.controller';
import { WEBSITE_REPOSITORY, WebsiteService } from './website.service';

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
