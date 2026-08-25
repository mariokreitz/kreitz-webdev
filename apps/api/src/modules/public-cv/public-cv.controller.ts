import { SkipResponseEnvelope } from '@app/common/decorators/skip-response-envelope.decorator';
import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { WebsiteTokenGuard } from '@app/common/guards/website-token.guard';
import { CV_MIME_TYPE } from '@app/modules/cv-document';
import { PublicCvService } from '@app/modules/public-cv/public-cv.service';
import { sanitizeCvFileName } from '@app/modules/cv-document/utils/sanitize-cv-file-name';
import { Controller, Get, Req, StreamableFile, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Request } from 'express';

@ApiTags('Public CV')
@Controller('public/cv')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteTokenGuard, ArcjetRateLimitGuard)
@AllowAnonymous()
export class PublicCvController {
  constructor(private readonly publicCvService: PublicCvService) {}

  @Get()
  @SkipResponseEnvelope()
  @ApiOperation({
    summary: 'Download the CV for the authenticated website, if one exists',
  })
  @ApiResponse({ status: 200, description: 'The CV PDF file bytes' })
  @ApiResponse({ status: 401, description: 'Website token is missing, invalid, expired, or revoked' })
  @ApiResponse({
    status: 403,
    description: 'Website token is valid but the website is disabled or the request origin is not permitted',
  })
  @ApiResponse({ status: 404, description: 'No CV is available for this website' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded for this website token' })
  public async download(@Req() request: Request): Promise<StreamableFile> {
    const websiteId = request.websiteId;

    if (!websiteId) {
      throw new UnauthorizedException('Website authentication required');
    }

    const cv = await this.publicCvService.getCvForWebsite(websiteId);

    return new StreamableFile(cv.data, {
      type: CV_MIME_TYPE,
      disposition: `attachment; filename="${sanitizeCvFileName(cv.fileName)}"`,
    });
  }
}
