import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { UpdateWebsiteData, WebsiteRecord } from '@app/database/types/website.repository.types';
// Leaf import, not the barrel — website-domain's barrel pulls in WebsiteModule, which would cycle back here.
import { normalizeDomain } from '@app/modules/website-domain/utils/normalize-domain';
import { generateVerificationToken } from '@app/modules/website-domain/utils/generate-verification-token';
import { CreateWebsiteInput } from '@app/modules/website/types/website.types';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { WEBSITE_REPOSITORY } from './tokens/website.tokens';

@Injectable()
export class WebsiteService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebsiteService.name);
  }

  public async getAllForUser(userId: string): Promise<WebsiteRecord[]> {
    return this.websiteRepository.findManyByUserId(userId);
  }

  public async getByIdForUser(id: string, userId: string): Promise<WebsiteRecord> {
    const website = await this.websiteRepository.findByIdAndUserId(id, userId);

    if (!website) {
      this.logger.warn({ event: 'website.rejected', reason: 'not_found', websiteId: id, userId });

      throw new NotFoundException('Website not found');
    }

    return website;
  }

  public async ensureOwnership(websiteId: string, userId: string): Promise<WebsiteRecord> {
    return this.getByIdForUser(websiteId, userId);
  }

  public async create(input: CreateWebsiteInput): Promise<WebsiteRecord> {
    const domain = this.extractDomain(input.url);
    const slug = this.generateSlug(input.name);

    const existingDomain = await this.websiteRepository.findByDomain(domain);

    if (existingDomain) {
      this.logger.warn({ event: 'website.rejected', reason: 'domain_conflict', domain, userId: input.userId });

      throw new ConflictException('This domain is already registered');
    }

    const existingSlug = await this.websiteRepository.findBySlug(slug);

    if (existingSlug) {
      this.logger.warn({ event: 'website.rejected', reason: 'slug_conflict', slug, userId: input.userId });

      throw new ConflictException('A website with this slug already exists');
    }

    const created = await this.websiteRepository.create({
      userId: input.userId,
      name: input.name,
      slug,
      domain,
      verificationToken: generateVerificationToken(),
    });

    this.logger.info({ event: 'website.created', websiteId: created.id, userId: input.userId });

    return created;
  }

  public async update(id: string, userId: string, data: UpdateWebsiteData): Promise<WebsiteRecord> {
    const website = await this.websiteRepository.findByIdAndUserId(id, userId);

    if (!website) {
      this.logger.warn({ event: 'website.rejected', reason: 'not_found', websiteId: id, userId });

      throw new NotFoundException('Website not found');
    }

    if (data.slug && data.slug !== website.slug) {
      const existingSlug = await this.websiteRepository.findBySlug(data.slug);

      if (existingSlug) {
        this.logger.warn({
          event: 'website.rejected',
          reason: 'slug_conflict',
          slug: data.slug,
          websiteId: id,
          userId,
        });

        throw new ConflictException('A website with this slug already exists');
      }
    }

    const updatedWebsite = await this.websiteRepository.update(id, userId, data);

    if (!updatedWebsite) {
      this.logger.warn({ event: 'website.rejected', reason: 'not_found', websiteId: id, userId });

      throw new NotFoundException('Website not found');
    }

    this.logger.info({ event: 'website.updated', websiteId: updatedWebsite.id, userId });

    return updatedWebsite;
  }

  public async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.websiteRepository.delete(id, userId);

    if (!deleted) {
      this.logger.warn({ event: 'website.rejected', reason: 'not_found', websiteId: id, userId });

      throw new NotFoundException('Website not found');
    }

    this.logger.info({ event: 'website.deleted', websiteId: id, userId });
  }

  private extractDomain(url: string): string {
    const parsedUrl = new URL(url);
    const normalized = normalizeDomain(parsedUrl.hostname);

    // normalizeDomain returns unknown to double as a class-transformer callback; a string in always yields a string out.
    return typeof normalized === 'string' ? normalized : parsedUrl.hostname.toLowerCase();
  }

  private generateSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
