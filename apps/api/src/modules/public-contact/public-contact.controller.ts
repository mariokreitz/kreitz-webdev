import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { WebsiteTokenGuard } from '@app/common/guards/website-token.guard';
import { SubmitContactFormDto } from '@app/modules/public-contact/dto/submit-contact-form.dto';
import { PublicContactService } from '@app/modules/public-contact/public-contact.service';

import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { Request } from 'express';

// WHY: this route is only ever called server-to-server by the frontend's own SSR proxy (never
// directly by a visitor's browser, since the website token must never reach the browser), so
// ArcjetBotDetectionGuard would evaluate our own trusted server's fetch and deny it in LIVE mode
// instead of the visitor. Bot/spam mitigation for this feature lives at the actual visitor-facing
// boundary (the frontend's own POST /api/contact route); this controller still gets WebsiteTokenGuard
// (bearer token + disabled-website + origin checks) and ArcjetRateLimitGuard's per-website token bucket.
@ApiTags('Public Contact')
@Controller('public/contact')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteTokenGuard, ArcjetRateLimitGuard)
@AllowAnonymous()
export class PublicContactController {
  constructor(private readonly publicContactService: PublicContactService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit a contact form message for the authenticated website',
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
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
  @ApiResponse({
    status: 503,
    description: 'The message could not be delivered',
  })
  public async submit(@Body() dto: SubmitContactFormDto, @Req() request: Request): Promise<void> {
    const websiteId = request.websiteId;

    if (!websiteId) {
      throw new UnauthorizedException('Website authentication required');
    }

    await this.publicContactService.submit(websiteId, dto);
  }
}
