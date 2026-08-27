import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { WebsiteTokenGuard } from '@app/common/guards/website-token.guard';
import { PublicSocialLinkDto } from '@app/modules/public-social-links/dto/public-social-link.dto';
import { PublicSocialLinkService } from '@app/modules/public-social-links/public-social-link.service';

import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { Request } from 'express';

@ApiTags('Public Social Links')
@Controller('public/social-links')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteTokenGuard, ArcjetRateLimitGuard)
@AllowAnonymous()
export class PublicSocialLinkController {
  constructor(private readonly publicSocialLinkService: PublicSocialLinkService) {}

  @Get()
  @ApiOperation({
    summary: 'Get social links for the authenticated website',
  })
  @ApiResponse({
    status: 200,
    type: PublicSocialLinkDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Website token is missing, invalid, expired, or revoked',
  })
  @ApiResponse({
    status: 403,
    description: 'Website token is valid but the website is disabled or the request origin is not permitted',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded for this website token',
  })
  public async getSocialLinks(@Req() request: Request): Promise<PublicSocialLinkDto[]> {
    const websiteId = request.websiteId;

    if (!websiteId) {
      throw new UnauthorizedException('Website authentication required');
    }

    return this.publicSocialLinkService.getSocialLinks(websiteId);
  }
}
