import { WebsiteRepository } from '@app/database/repositories/website.repository';
import { Module } from '@nestjs/common';
import { WEBSITE_REPOSITORY } from './tokens/website.tokens';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';

@Module({
  controllers: [WebsiteController],
  providers: [
    WebsiteService,
    {
      provide: WEBSITE_REPOSITORY,
      useClass: WebsiteRepository,
    },
  ],
  exports: [WebsiteService, WEBSITE_REPOSITORY],
})
export class WebsiteModule {}
