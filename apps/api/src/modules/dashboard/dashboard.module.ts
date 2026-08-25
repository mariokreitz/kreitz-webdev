import { WebsiteDomainSummaryRepository } from '@app/database/repositories/website-domain-summary.repository';
import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { WEBSITE_DOMAIN_SUMMARY_REPOSITORY } from './tokens/dashboard.tokens';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    {
      provide: WEBSITE_DOMAIN_SUMMARY_REPOSITORY,
      useClass: WebsiteDomainSummaryRepository,
    },
  ],
})
export class DashboardModule {}
