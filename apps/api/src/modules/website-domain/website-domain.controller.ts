import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { WebsiteDomainService } from '@app/modules/website-domain/website-domain.service';

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Session, UserSession } from '@thallesp/nestjs-better-auth';

import { CreateWebsiteDomainDto } from './dto/create-website-domain.dto';
import { UpdateWebsiteDomainDto } from './dto/update-website-domain.dto';

@ApiTags('Website Domains')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@Controller('websites/:websiteId/domains')
export class WebsiteDomainController {
  constructor(private readonly websiteDomainService: WebsiteDomainService) {}

  @Get()
  @ApiOperation({ summary: 'Get all domains registered for a website' })
  @ApiResponse({ status: 200, description: 'Domains for the website' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async getAll(
    @Param('websiteId') websiteId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord[]> {
    return this.websiteDomainService.getAllForUser(websiteId, session.user.id);
  }

  @Get(':domainId')
  @ApiOperation({ summary: 'Get a domain registered for a website' })
  @ApiResponse({ status: 200, description: 'The requested domain' })
  @ApiResponse({ status: 404, description: 'Website or website domain not found' })
  public async getById(
    @Param('websiteId') websiteId: string,
    @Param('domainId') domainId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord> {
    return this.websiteDomainService.getByIdForUser(websiteId, domainId, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a domain for a website' })
  @ApiResponse({ status: 201, description: 'The created website domain' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  @ApiResponse({ status: 409, description: 'Domain already registered' })
  public async create(
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateWebsiteDomainDto,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord> {
    return this.websiteDomainService.create(websiteId, session.user.id, dto.domain);
  }

  @Patch(':domainId')
  @ApiOperation({ summary: 'Update a domain registered for a website' })
  @ApiResponse({ status: 200, description: 'The updated website domain' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website or website domain not found' })
  @ApiResponse({ status: 409, description: 'Domain already registered' })
  public async update(
    @Param('websiteId') websiteId: string,
    @Param('domainId') domainId: string,
    @Body() dto: UpdateWebsiteDomainDto,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord> {
    return this.websiteDomainService.update(websiteId, domainId, session.user.id, dto.domain);
  }

  @Delete(':domainId')
  @ApiOperation({ summary: 'Delete a domain registered for a website' })
  @ApiResponse({ status: 200, description: 'Website domain deleted' })
  @ApiResponse({ status: 404, description: 'Website or website domain not found' })
  public async delete(
    @Param('websiteId') websiteId: string,
    @Param('domainId') domainId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.websiteDomainService.delete(websiteId, domainId, session.user.id);
  }
}
