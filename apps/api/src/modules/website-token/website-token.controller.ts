import { WebsiteTokenRecord } from '@app/database/types/website-token.types';
import { CreatedWebsiteTokenResponse } from '@app/modules/website-token/types/website-token.types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { CreateWebsiteTokenDto } from './dto/create-website-token.dto';

import { WebsiteTokenService } from './website-token.service';

@Controller('websites/:websiteId/tokens')
export class WebsiteTokenController {
  constructor(private readonly websiteTokenService: WebsiteTokenService) {}

  @Get()
  public async getAll(
    @Param('websiteId') websiteId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteTokenRecord[]> {
    return this.websiteTokenService.getAllForUser(websiteId, session.user.id);
  }

  @Get(':tokenId')
  public async getById(
    @Param('websiteId') websiteId: string,
    @Param('tokenId') tokenId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteTokenRecord> {
    return this.websiteTokenService.getByIdForUser(websiteId, tokenId, session.user.id);
  }

  @Post()
  public async create(
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateWebsiteTokenDto,
    @Session() session: UserSession,
  ): Promise<CreatedWebsiteTokenResponse> {
    return this.websiteTokenService.create(websiteId, session.user.id, dto.name, dto.expiresAt);
  }

  @Delete(':tokenId')
  public async delete(
    @Param('websiteId') websiteId: string,
    @Param('tokenId') tokenId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.websiteTokenService.delete(websiteId, tokenId, session.user.id);
  }
}
