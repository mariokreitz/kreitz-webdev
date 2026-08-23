import { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';

import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';

import { CreatedWebsiteTokenResponse, WebsiteTokenRecord } from '@app/database/types/website-token.types';
import { generateWebsiteToken } from '@app/modules/website-token/utils/website-token.utils';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { WEBSITE_REPOSITORY } from '../website/tokens/website.tokens';
import { WEBSITE_TOKEN_REPOSITORY } from './tokens/website-token.tokens';

@Injectable()
export class WebsiteTokenService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,

    @Inject(WEBSITE_TOKEN_REPOSITORY)
    private readonly websiteTokenRepository: IWebsiteTokenRepository,
  ) {}

  public async getAllForUser(websiteId: string, userId: string): Promise<WebsiteTokenRecord[]> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    return this.websiteTokenRepository.findManyByWebsiteId(websiteId);
  }

  public async getByIdForUser(websiteId: string, tokenId: string, userId: string): Promise<WebsiteTokenRecord> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const token = await this.websiteTokenRepository.findByIdAndWebsiteId(tokenId, websiteId);

    if (!token) {
      throw new NotFoundException('Website token not found');
    }

    return token;
  }

  public async create(
    websiteId: string,
    userId: string,
    name: string,
    expiresAt?: string,
  ): Promise<CreatedWebsiteTokenResponse> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const generated = generateWebsiteToken();

    const token = await this.websiteTokenRepository.create({
      websiteId,
      name,
      prefix: generated.prefix,
      tokenHash: generated.tokenHash,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return {
      id: token.id,
      name: token.name,
      prefix: token.prefix,
      token: generated.token,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };
  }

  public async delete(websiteId: string, tokenId: string, userId: string): Promise<void> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const deleted = await this.websiteTokenRepository.delete(tokenId, websiteId);

    if (!deleted) {
      throw new NotFoundException('Website token not found');
    }
  }

  private async ensureWebsiteOwnership(websiteId: string, userId: string): Promise<void> {
    const website = await this.websiteRepository.findByIdAndUserId(websiteId, userId);

    if (!website) {
      throw new NotFoundException('Website not found');
    }
  }
}
