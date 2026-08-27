import { CacheService } from '@app/database/cache';
import { ISocialLinkRepository } from '@app/database/interfaces/social-link.repository.interface';
import { CreateSocialLinkData, SocialLinkRecord, UpdateSocialLinkData } from '@app/database/types/social-link.types';
import { WebsiteService } from '@app/modules/website';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SOCIAL_LINK_REPOSITORY } from './tokens/social-link.tokens';
import { buildWebsiteSocialLinksCacheKey } from './utils/social-link.utils';

@Injectable()
export class SocialLinkService {
  constructor(
    private readonly websiteService: WebsiteService,

    @Inject(SOCIAL_LINK_REPOSITORY)
    private readonly socialLinkRepository: ISocialLinkRepository,

    private readonly cacheService: CacheService,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SocialLinkService.name);
  }

  public async getAllForUser(websiteId: string, userId: string): Promise<SocialLinkRecord[]> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    return this.socialLinkRepository.findManyByWebsiteId(websiteId);
  }

  public async getByIdForUser(websiteId: string, socialLinkId: string, userId: string): Promise<SocialLinkRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const socialLink = await this.socialLinkRepository.findByIdAndWebsiteId(socialLinkId, websiteId);

    if (!socialLink) {
      this.logger.warn({ event: 'social_link.rejected', reason: 'not_found', websiteId, socialLinkId });

      throw new NotFoundException('Social link not found');
    }

    return socialLink;
  }

  public async create(websiteId: string, userId: string, data: CreateSocialLinkData): Promise<SocialLinkRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const created = await this.socialLinkRepository.create(data);

    await this.cacheService.del(buildWebsiteSocialLinksCacheKey(websiteId));

    this.logger.info({ event: 'social_link.created', websiteId, socialLinkId: created.id });

    return created;
  }

  public async update(
    websiteId: string,
    socialLinkId: string,
    userId: string,
    data: UpdateSocialLinkData,
  ): Promise<SocialLinkRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const updated = await this.socialLinkRepository.update(socialLinkId, websiteId, data);

    if (!updated) {
      this.logger.warn({ event: 'social_link.rejected', reason: 'not_found', websiteId, socialLinkId });

      throw new NotFoundException('Social link not found');
    }

    await this.cacheService.del(buildWebsiteSocialLinksCacheKey(websiteId));

    this.logger.info({ event: 'social_link.updated', websiteId, socialLinkId });

    return updated;
  }

  public async delete(websiteId: string, socialLinkId: string, userId: string): Promise<void> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const deleted = await this.socialLinkRepository.delete(socialLinkId, websiteId);

    if (!deleted) {
      this.logger.warn({ event: 'social_link.rejected', reason: 'not_found', websiteId, socialLinkId });

      throw new NotFoundException('Social link not found');
    }

    await this.cacheService.del(buildWebsiteSocialLinksCacheKey(websiteId));

    this.logger.info({ event: 'social_link.deleted', websiteId, socialLinkId });
  }
}
