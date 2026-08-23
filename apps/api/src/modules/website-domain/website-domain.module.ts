import { WebsiteDomainRepository } from '@app/database/repositories/website-domain.repository';
import { WebsiteModule } from '@app/modules/website/website.module';
import { Module } from '@nestjs/common';
import { WEBSITE_DOMAIN_REPOSITORY } from './tokens/website-domain.tokens';

import { WebsiteDomainController } from './website-domain.controller';
import { WebsiteDomainService } from './website-domain.service';

@Module({
  imports: [WebsiteModule],
  controllers: [WebsiteDomainController],
  providers: [
    WebsiteDomainService,
    {
      provide: WEBSITE_DOMAIN_REPOSITORY,
      useClass: WebsiteDomainRepository,
    },
  ],
  exports: [WebsiteDomainService, WEBSITE_DOMAIN_REPOSITORY],
})
export class WebsiteDomainModule {}
