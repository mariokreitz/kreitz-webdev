import { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';

import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';
import { CreatedWebsiteTokenResponse } from '@app/modules/website-token/dto/created-website-token.response';
import { WebsiteTokenSummaryResponse } from '@app/modules/website-token/dto/website-token-summary.response';

import { generateWebsiteToken, toWebsiteTokenSummary } from '@app/modules/website-token/utils/website-token.utils';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { WEBSITE_REPOSITORY } from '../website/tokens/website.tokens';
import { WEBSITE_TOKEN_REPOSITORY } from './tokens/website-token.tokens';

@Injectable()
export class WebsiteTokenService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,

    @Inject(WEBSITE_TOKEN_REPOSITORY)
    private readonly websiteTokenRepository: IWebsiteTokenRepository,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebsiteTokenService.name);
  }

  public async getAllForUser(websiteId: string, userId: string): Promise<WebsiteTokenSummaryResponse[]> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const tokens = await this.websiteTokenRepository.findManyByWebsiteId(websiteId);

    return tokens.map(toWebsiteTokenSummary);
  }

  public async getByIdForUser(
    websiteId: string,
    tokenId: string,
    userId: string,
  ): Promise<WebsiteTokenSummaryResponse> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const token = await this.websiteTokenRepository.findByIdAndWebsiteId(tokenId, websiteId);

    if (!token) {
      throw new NotFoundException('Website token not found');
    }

    return toWebsiteTokenSummary(token);
  }

  public async create(
    websiteId: string,
    userId: string,
    name: string,
    expiresAt?: string,
  ): Promise<CreatedWebsiteTokenResponse> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const created = await this.createToken(websiteId, name, expiresAt ? new Date(expiresAt) : null);

    this.logger.info({ event: 'website_token.created', websiteId, tokenId: created.id });

    return created;
  }

  public async delete(websiteId: string, tokenId: string, userId: string): Promise<void> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const deleted = await this.websiteTokenRepository.delete(tokenId, websiteId);

    if (!deleted) {
      throw new NotFoundException('Website token not found');
    }

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

    return this.toCreatedResponse(token, generated.token);
  }

  private toCreatedResponse(token: WebsiteTokenRecord, plaintextToken: string): CreatedWebsiteTokenResponse {
    return {
      id: token.id,
      name: token.name,
      prefix: token.prefix,
      token: plaintextToken,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };
  }

  private async ensureWebsiteOwnership(websiteId: string, userId: string): Promise<void> {
    const website = await this.websiteRepository.findByIdAndUserId(websiteId, userId);

    if (!website) {
      throw new NotFoundException('Website not found');
    }
  }
}
