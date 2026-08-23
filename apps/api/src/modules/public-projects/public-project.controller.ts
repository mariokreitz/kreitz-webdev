import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { WebsiteTokenGuard } from '@app/common/guards/website-token.guard';
import { PublicProjectDto } from '@app/modules/public-projects/dto/public-project.dto';
import { PublicProjectService } from '@app/modules/public-projects/public-project.service';

import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { Request } from 'express';

@ApiTags('Public Projects')
@Controller('public/projects')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteTokenGuard, ArcjetRateLimitGuard)
@AllowAnonymous()
export class PublicProjectController {
  constructor(private readonly publicProjectService: PublicProjectService) {}

  @Get()
  @ApiOperation({
    summary: 'Get published projects for the authenticated website',
  })
  @ApiResponse({
    status: 200,
    type: PublicProjectDto,
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
  public async getProjects(@Req() request: Request): Promise<PublicProjectDto[]> {
    const websiteId = request.websiteId;

    if (!websiteId) {
      throw new UnauthorizedException('Website authentication required');
    }

    return this.publicProjectService.getPublishedProjects(websiteId);
  }
}
