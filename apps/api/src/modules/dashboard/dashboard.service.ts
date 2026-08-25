import { IWebsiteDomainSummaryRepository } from '@app/database/interfaces/website-domain-summary.repository.interface';
import { WebsiteDomainSummaryRecord } from '@app/database/types/website-domain-summary.types';
import { Inject, Injectable } from '@nestjs/common';
import { WEBSITE_DOMAIN_SUMMARY_REPOSITORY } from './tokens/dashboard.tokens';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(WEBSITE_DOMAIN_SUMMARY_REPOSITORY)
    private readonly websiteDomainSummaryRepository: IWebsiteDomainSummaryRepository,
  ) {}

  public async getDomainsSummaryForUser(userId: string): Promise<WebsiteDomainSummaryRecord> {
    return this.websiteDomainSummaryRepository.countForUser(userId);
  }
}
