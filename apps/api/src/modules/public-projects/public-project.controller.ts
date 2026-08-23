import { WebsiteTokenGuard } from '@app/common/guards/website-token.guard';
import { PublicProjectRecord } from '@app/database/types/public-project.types';
import { PublicProjectService } from '@app/modules/public-projects/public-project.service';

import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { Request } from 'express';

@Controller('public/projects')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteTokenGuard)
@AllowAnonymous()
export class PublicProjectController {
  constructor(private readonly publicProjectService: PublicProjectService) {}

  @Get()
  public async getProjects(@Req() request: Request): Promise<PublicProjectRecord[]> {
    const websiteId = request.websiteId;

    if (!websiteId) {
      throw new UnauthorizedException('Website authentication required');
    }

    return this.publicProjectService.getPublishedProjects(websiteId);
  }
}
