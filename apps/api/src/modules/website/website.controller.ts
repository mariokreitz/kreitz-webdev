import { WebsiteRecord } from '@app/database/types/website.repository.types';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { WebsiteService } from './website.service';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  public async getAll(@Session() session: UserSession): Promise<WebsiteRecord[]> {
    return this.websiteService.getAllForUser(session.user.id);
  }

  @Get(':id')
  public async getById(@Param('id') id: string, @Session() session: UserSession): Promise<WebsiteRecord> {
    return this.websiteService.getByIdForUser(id, session.user.id);
  }

  @Post()
  public async create(@Body() dto: CreateWebsiteDto, @Session() session: UserSession): Promise<WebsiteRecord> {
    return this.websiteService.create({
      userId: session.user.id,
      name: dto.name,
      url: dto.url,
    });
  }

  @Patch(':id')
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateWebsiteDto,
    @Session() session: UserSession,
  ): Promise<WebsiteRecord> {
    return this.websiteService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  public async delete(@Param('id') id: string, @Session() session: UserSession): Promise<void> {
    return this.websiteService.delete(id, session.user.id);
  }
}
