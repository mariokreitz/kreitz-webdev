import { WebsiteRecord } from '@app/database/types/website.repository.types';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { WebsiteService } from './website.service';

@ApiTags('Websites')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'Get all websites belonging to the current user' })
  @ApiResponse({ status: 200, description: 'Websites for the current user' })
  public async getAll(@Session() session: UserSession): Promise<WebsiteRecord[]> {
    return this.websiteService.getAllForUser(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a website belonging to the current user' })
  @ApiResponse({ status: 200, description: 'The requested website' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async getById(@Param('id') id: string, @Session() session: UserSession): Promise<WebsiteRecord> {
    return this.websiteService.getByIdForUser(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a website' })
  @ApiResponse({ status: 201, description: 'The created website' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Domain or slug already registered' })
  public async create(@Body() dto: CreateWebsiteDto, @Session() session: UserSession): Promise<WebsiteRecord> {
    return this.websiteService.create({
      userId: session.user.id,
      name: dto.name,
      url: dto.url,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a website' })
  @ApiResponse({ status: 200, description: 'The updated website' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  @ApiResponse({ status: 409, description: 'Slug already registered' })
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateWebsiteDto,
    @Session() session: UserSession,
  ): Promise<WebsiteRecord> {
    return this.websiteService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a website' })
  @ApiResponse({ status: 200, description: 'Website deleted' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async delete(@Param('id') id: string, @Session() session: UserSession): Promise<void> {
    return this.websiteService.delete(id, session.user.id);
  }
}
