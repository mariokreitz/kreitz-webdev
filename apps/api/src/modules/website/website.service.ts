import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { UpdateWebsiteData, WebsiteRecord } from '@app/database/types/website.repository.types';
import { CreateWebsiteInput } from '@app/modules/website/types/website.types';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WEBSITE_REPOSITORY } from './tokens/website.tokens';

@Injectable()
export class WebsiteService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,
  ) {}

  public async getAllForUser(userId: string): Promise<WebsiteRecord[]> {
    return this.websiteRepository.findManyByUserId(userId);
  }

  public async getByIdForUser(id: string, userId: string): Promise<WebsiteRecord> {
    const website = await this.websiteRepository.findByIdAndUserId(id, userId);

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    return website;
  }

  public async create(input: CreateWebsiteInput): Promise<WebsiteRecord> {
    const domain = this.extractDomain(input.url);
    const slug = this.generateSlug(input.name);

    const existingDomain = await this.websiteRepository.findByDomain(domain);

    if (existingDomain) {
      throw new ConflictException('This domain is already registered');
    }

    const existingSlug = await this.websiteRepository.findBySlug(slug);

    if (existingSlug) {
      throw new ConflictException('A website with this slug already exists');
    }

    return this.websiteRepository.create({
      userId: input.userId,
      name: input.name,
      slug,
      domain,
    });
  }

  public async update(id: string, userId: string, data: UpdateWebsiteData): Promise<WebsiteRecord> {
    const website = await this.websiteRepository.findByIdAndUserId(id, userId);

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    if (data.slug && data.slug !== website.slug) {
      const existingSlug = await this.websiteRepository.findBySlug(data.slug);

      if (existingSlug) {
        throw new ConflictException('A website with this slug already exists');
      }
    }

    const updatedWebsite = await this.websiteRepository.update(id, userId, data);

    if (!updatedWebsite) {
      throw new NotFoundException('Website not found');
    }

    return updatedWebsite;
  }

  public async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.websiteRepository.delete(id, userId);

    if (!deleted) {
      throw new NotFoundException('Website not found');
    }
  }

  private extractDomain(url: string): string {
    const parsedUrl = new URL(url);

    return parsedUrl.hostname.toLowerCase().replace(/\.$/, '');
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
