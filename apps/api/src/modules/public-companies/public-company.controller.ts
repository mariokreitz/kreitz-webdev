import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { WebsiteTokenGuard } from '@app/common/guards/website-token.guard';
import { PublicCompanyDto } from '@app/modules/public-companies/dto/public-company.dto';
import { PublicCompanyService } from '@app/modules/public-companies/public-company.service';

import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { Request } from 'express';

@ApiTags('Public Companies')
@Controller('public/companies')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteTokenGuard, ArcjetRateLimitGuard)
@AllowAnonymous()
export class PublicCompanyController {
  constructor(private readonly publicCompanyService: PublicCompanyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get companies for the authenticated website',
  })
  @ApiResponse({
    status: 200,
    type: PublicCompanyDto,
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
  public async getCompanies(@Req() request: Request): Promise<PublicCompanyDto[]> {
    const websiteId = request.websiteId;

    if (!websiteId) {
      throw new UnauthorizedException('Website authentication required');
    }

    return this.publicCompanyService.getCompanies(websiteId);
  }
}
