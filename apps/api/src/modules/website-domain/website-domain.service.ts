import { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { WEBSITE_REPOSITORY } from '../website/tokens/website.tokens';
import { WEBSITE_DOMAIN_REPOSITORY } from './tokens/website-domain.tokens';

@Injectable()
export class WebsiteDomainService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,

    @Inject(WEBSITE_DOMAIN_REPOSITORY)
    private readonly websiteDomainRepository: IWebsiteDomainRepository,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebsiteDomainService.name);
  }

  public async getAllForUser(websiteId: string, userId: string): Promise<WebsiteDomainRecord[]> {
    const website = await this.websiteRepository.findByIdAndUserId(websiteId, userId);

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    return this.websiteDomainRepository.findManyByWebsiteId(websiteId);
  }

  public async getByIdForUser(websiteId: string, domainId: string, userId: string): Promise<WebsiteDomainRecord> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const domain = await this.websiteDomainRepository.findByIdAndWebsiteId(domainId, websiteId);

    if (!domain) {
      throw new NotFoundException('Website domain not found');
    }

    return domain;
  }

  public async create(websiteId: string, userId: string, domain: string): Promise<WebsiteDomainRecord> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const existingDomain = await this.websiteDomainRepository.findByDomain(domain);

    if (existingDomain) {
      throw new ConflictException('This domain is already registered');
    }

    const created = await this.websiteDomainRepository.create(websiteId, domain);

    this.logger.info({ event: 'website_domain.created', websiteId, domainId: created.id, domain });

    return created;
  }

  public async update(
    websiteId: string,
    domainId: string,
    userId: string,
    domain: string,
  ): Promise<WebsiteDomainRecord> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const existingDomain = await this.websiteDomainRepository.findByIdAndWebsiteId(domainId, websiteId);

    if (!existingDomain) {
      throw new NotFoundException('Website domain not found');
    }

    if (existingDomain.domain !== domain) {
      const domainAlreadyRegistered = await this.websiteDomainRepository.findByDomain(domain);

      if (domainAlreadyRegistered) {
        throw new ConflictException('This domain is already registered');
      }
    }

    const updatedDomain = await this.websiteDomainRepository.update(domainId, websiteId, domain);

    if (!updatedDomain) {
      throw new NotFoundException('Website domain not found');
    }

    this.logger.info({ event: 'website_domain.updated', websiteId, domainId: updatedDomain.id, domain });

    return updatedDomain;
  }

  public async delete(websiteId: string, domainId: string, userId: string): Promise<void> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const deleted = await this.websiteDomainRepository.delete(domainId, websiteId);

    if (!deleted) {
      throw new NotFoundException('Website domain not found');
    }

    this.logger.info({ event: 'website_domain.deleted', websiteId, domainId });
  }

  private async ensureWebsiteOwnership(websiteId: string, userId: string): Promise<void> {
    const website = await this.websiteRepository.findByIdAndUserId(websiteId, userId);

    if (!website) {
      throw new NotFoundException('Website not found');
    }
  }
}
