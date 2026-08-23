import { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { WebsiteService } from '@app/modules/website';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { WEBSITE_DOMAIN_REPOSITORY } from './tokens/website-domain.tokens';

@Injectable()
export class WebsiteDomainService {
  constructor(
    private readonly websiteService: WebsiteService,

    @Inject(WEBSITE_DOMAIN_REPOSITORY)
    private readonly websiteDomainRepository: IWebsiteDomainRepository,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebsiteDomainService.name);
  }

  public async getAllForUser(websiteId: string, userId: string): Promise<WebsiteDomainRecord[]> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    return this.websiteDomainRepository.findManyByWebsiteId(websiteId);
  }

  public async getByIdForUser(websiteId: string, domainId: string, userId: string): Promise<WebsiteDomainRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const domain = await this.websiteDomainRepository.findByIdAndWebsiteId(domainId, websiteId);

    if (!domain) {
      this.logger.warn({ event: 'website_domain.rejected', reason: 'not_found', websiteId, domainId });

      throw new NotFoundException('Website domain not found');
    }

    return domain;
  }

  public async create(websiteId: string, userId: string, domain: string): Promise<WebsiteDomainRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const existingDomain = await this.websiteDomainRepository.findByDomain(domain);

    if (existingDomain) {
      this.logger.warn({ event: 'website_domain.rejected', reason: 'domain_conflict', websiteId, domain });

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
    domain?: string,
  ): Promise<WebsiteDomainRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const existingDomain = await this.websiteDomainRepository.findByIdAndWebsiteId(domainId, websiteId);

    if (!existingDomain) {
      this.logger.warn({ event: 'website_domain.rejected', reason: 'not_found', websiteId, domainId });

      throw new NotFoundException('Website domain not found');
    }

    if (domain === undefined || domain === existingDomain.domain) {
      return existingDomain;
    }

    const domainAlreadyRegistered = await this.websiteDomainRepository.findByDomain(domain);

    if (domainAlreadyRegistered) {
      this.logger.warn({ event: 'website_domain.rejected', reason: 'domain_conflict', websiteId, domainId, domain });

      throw new ConflictException('This domain is already registered');
    }

    const updatedDomain = await this.websiteDomainRepository.update(domainId, websiteId, domain);

    if (!updatedDomain) {
      this.logger.warn({ event: 'website_domain.rejected', reason: 'not_found', websiteId, domainId });

      throw new NotFoundException('Website domain not found');
    }

    this.logger.info({ event: 'website_domain.updated', websiteId, domainId: updatedDomain.id, domain });

    return updatedDomain;
  }

  public async delete(websiteId: string, domainId: string, userId: string): Promise<void> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const deleted = await this.websiteDomainRepository.delete(domainId, websiteId);

    if (!deleted) {
      this.logger.warn({ event: 'website_domain.rejected', reason: 'not_found', websiteId, domainId });

      throw new NotFoundException('Website domain not found');
    }

    this.logger.info({ event: 'website_domain.deleted', websiteId, domainId });
  }
}
