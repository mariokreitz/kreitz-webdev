import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { SkipResponseEnvelope } from '@app/common/decorators/skip-response-envelope.decorator';
import { CreatedWebsiteTokenResponse } from '@app/modules/website-token/dto/created-website-token.response';
import { WebsiteTokenSummaryResponse } from '@app/modules/website-token/dto/website-token-summary.response';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { CreateWebsiteTokenDto } from './dto/create-website-token.dto';

import { WebsiteTokenService } from './website-token.service';

@ApiTags('Website Tokens')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@UseGuards(ArcjetRateLimitGuard)
@Controller('websites/:websiteId/tokens')
export class WebsiteTokenController {
  constructor(private readonly websiteTokenService: WebsiteTokenService) {}

  @Get()
  @ApiOperation({ summary: 'List all tokens for a website owned by the current user' })
  @ApiResponse({ status: 200, type: [WebsiteTokenSummaryResponse] })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async getAll(
    @Param('websiteId') websiteId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteTokenSummaryResponse[]> {
    return this.websiteTokenService.getAllForUser(websiteId, session.user.id);
  }

  @Get(':tokenId')
  @ApiOperation({ summary: 'Get a single token for a website owned by the current user' })
  @ApiResponse({ status: 200, type: WebsiteTokenSummaryResponse })
  @ApiResponse({ status: 404, description: 'Website or token not found' })
  public async getById(
    @Param('websiteId') websiteId: string,
    @Param('tokenId') tokenId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteTokenSummaryResponse> {
    return this.websiteTokenService.getByIdForUser(websiteId, tokenId, session.user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a website token',
    description: 'Returns the plaintext token exactly once. Only its prefix is ever exposed again.',
  })
  @ApiResponse({ status: 201, type: CreatedWebsiteTokenResponse })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async create(
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateWebsiteTokenDto,
    @Session() session: UserSession,
  ): Promise<CreatedWebsiteTokenResponse> {
    return this.websiteTokenService.create(websiteId, session.user.id, dto.name, dto.expiresAt);
  }

  @Delete(':tokenId')
  @HttpCode(204)
  @SkipResponseEnvelope()
  @ApiOperation({
    summary: 'Delete a website token',
    description: 'Permanently deletes the token. This cannot be undone.',
  })
  @ApiResponse({ status: 204, description: 'Token deleted' })
  @ApiResponse({ status: 404, description: 'Website or token not found' })
  public async delete(
    @Param('websiteId') websiteId: string,
    @Param('tokenId') tokenId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.websiteTokenService.delete(websiteId, tokenId, session.user.id);
  }
}
