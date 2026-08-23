import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { WebsiteDomainService } from '@app/modules/website-domain/website-domain.service';

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Session, UserSession } from '@thallesp/nestjs-better-auth';

import { CreateWebsiteDomainDto } from './dto/create-website-domain.dto';
import { UpdateWebsiteDomainDto } from './dto/update-website-domain.dto';

@Controller('websites/:websiteId/domains')
export class WebsiteDomainController {
  constructor(private readonly websiteDomainService: WebsiteDomainService) {}

  @Get()
  public async getAll(
    @Param('websiteId') websiteId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord[]> {
    return this.websiteDomainService.getAllForUser(websiteId, session.user.id);
  }

  @Get(':domainId')
  public async getById(
    @Param('websiteId') websiteId: string,
    @Param('domainId') domainId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord> {
    return this.websiteDomainService.getByIdForUser(websiteId, domainId, session.user.id);
  }

  @Post()
  public async create(
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateWebsiteDomainDto,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord> {
    return this.websiteDomainService.create(websiteId, session.user.id, dto.url);
  }

  @Patch(':domainId')
  public async update(
    @Param('websiteId') websiteId: string,
    @Param('domainId') domainId: string,
    @Body() dto: UpdateWebsiteDomainDto,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord> {
    return this.websiteDomainService.update(websiteId, domainId, session.user.id, dto.url);
  }

  @Delete(':domainId')
  public async delete(
    @Param('websiteId') websiteId: string,
    @Param('domainId') domainId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.websiteDomainService.delete(websiteId, domainId, session.user.id);
  }
}
