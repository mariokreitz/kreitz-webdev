import { WebsiteDomainRepository } from '@app/database/repositories/website-domain.repository';
import { WEBSITE_DOMAIN_REPOSITORY } from '@app/modules/website-domain/tokens/website-domain.tokens';
import { WebsiteDomainService } from '@app/modules/website-domain/website-domain.service';
import { Module } from '@nestjs/common';

import { WebsiteModule } from '../website/website.module';

import { WebsiteDomainController } from './website-domain.controller';

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
