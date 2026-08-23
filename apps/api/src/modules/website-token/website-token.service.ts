import { CacheService } from '@app/database/cache';
import { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';

import { WebsiteService } from '@app/modules/website';
import { CreatedWebsiteTokenResponse } from '@app/modules/website-token/dto/created-website-token.response';
import { WebsiteTokenSummaryResponse } from '@app/modules/website-token/dto/website-token-summary.response';

import { buildWebsiteTokenCacheKey, generateWebsiteToken } from '@app/modules/website-token/utils/website-token.utils';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { WEBSITE_TOKEN_REPOSITORY } from './tokens/website-token.tokens';

@Injectable()
export class WebsiteTokenService {
  constructor(
    private readonly websiteService: WebsiteService,

    @Inject(WEBSITE_TOKEN_REPOSITORY)
    private readonly websiteTokenRepository: IWebsiteTokenRepository,

    private readonly cacheService: CacheService,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebsiteTokenService.name);
  }

  public async getAllForUser(websiteId: string, userId: string): Promise<WebsiteTokenSummaryResponse[]> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const tokens = await this.websiteTokenRepository.findManyByWebsiteId(websiteId);

    return tokens.map((token) => WebsiteTokenSummaryResponse.fromRecord(token));
  }

  public async getByIdForUser(
    websiteId: string,
    tokenId: string,
    userId: string,
  ): Promise<WebsiteTokenSummaryResponse> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const token = await this.websiteTokenRepository.findByIdAndWebsiteId(tokenId, websiteId);

    if (!token) {
      this.logger.warn({ event: 'website_token.rejected', reason: 'not_found', websiteId, tokenId });

      throw new NotFoundException('Website token not found');
    }

    return WebsiteTokenSummaryResponse.fromRecord(token);
  }

  public async create(
    websiteId: string,
    userId: string,
    name: string,
    expiresAt?: string,
  ): Promise<CreatedWebsiteTokenResponse> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const created = await this.createToken(websiteId, name, expiresAt ? new Date(expiresAt) : null);

    this.logger.info({ event: 'website_token.created', websiteId, tokenId: created.id });

    return created;
  }

  public async delete(websiteId: string, tokenId: string, userId: string): Promise<void> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const deleted = await this.websiteTokenRepository.delete(tokenId, websiteId);

    if (!deleted) {
      this.logger.warn({ event: 'website_token.rejected', reason: 'not_found', websiteId, tokenId });

      throw new NotFoundException('Website token not found');
    }

    await this.cacheService.del(buildWebsiteTokenCacheKey(deleted.tokenHash));

    this.logger.info({ event: 'website_token.deleted', websiteId, tokenId });
  }

  private async createToken(
    websiteId: string,
    name: string,
    expiresAt: Date | null,
  ): Promise<CreatedWebsiteTokenResponse> {
    const generated = generateWebsiteToken();

    const token = await this.websiteTokenRepository.create({
      websiteId,
      name,
      prefix: generated.prefix,
      tokenHash: generated.tokenHash,
      expiresAt,
    });

    return CreatedWebsiteTokenResponse.fromRecordAndSecret(token, generated.token);
  }
}
