import { WebsiteDomainRepository } from '@app/database/repositories/website-domain.repository';
import { WebsiteRepository } from '@app/database/repositories/website.repository';
import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { WEBSITE_DOMAIN_REPOSITORY } from '@app/modules/website-domain/tokens/website-domain.tokens';
import { WEBSITE_REPOSITORY } from '@app/modules/website/tokens/website.tokens';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class WebsiteDomainService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: WebsiteRepository,

    @Inject(WEBSITE_DOMAIN_REPOSITORY)
    private readonly websiteDomainRepository: WebsiteDomainRepository,
  ) {}

  public async getAllForUser(websiteId: string, userId: string): Promise<WebsiteDomainRecord[]> {
    const website = await this.websiteRepository.findByIdAndUserId(websiteId, userId);

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    return this.websiteDomainRepository.findManyByWebsiteId(websiteId);
  }
}
