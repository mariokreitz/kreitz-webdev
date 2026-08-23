import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { WebsiteDto } from './dto/website.dto';
import { WebsiteService } from './website.service';

@ApiTags('Websites')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'Get all websites belonging to the current user' })
  @ApiResponse({ status: 200, description: 'Websites for the current user', type: [WebsiteDto] })
  public async getAll(@Session() session: UserSession): Promise<WebsiteDto[]> {
    const websites = await this.websiteService.getAllForUser(session.user.id);

    return websites.map((website) => WebsiteDto.fromRecord(website));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a website belonging to the current user' })
  @ApiResponse({ status: 200, description: 'The requested website', type: WebsiteDto })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async getById(@Param('id') id: string, @Session() session: UserSession): Promise<WebsiteDto> {
    const website = await this.websiteService.getByIdForUser(id, session.user.id);

    return WebsiteDto.fromRecord(website);
  }

  @Post()
  @ApiOperation({ summary: 'Create a website' })
  @ApiResponse({ status: 201, description: 'The created website', type: WebsiteDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Domain or slug already registered' })
  public async create(@Body() dto: CreateWebsiteDto, @Session() session: UserSession): Promise<WebsiteDto> {
    const website = await this.websiteService.create({
      userId: session.user.id,
      name: dto.name,
      url: dto.url,
    });

    return WebsiteDto.fromRecord(website);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a website' })
  @ApiResponse({ status: 200, description: 'The updated website', type: WebsiteDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  @ApiResponse({ status: 409, description: 'Slug already registered' })
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateWebsiteDto,
    @Session() session: UserSession,
  ): Promise<WebsiteDto> {
    const website = await this.websiteService.update(id, session.user.id, dto);

    return WebsiteDto.fromRecord(website);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a website' })
  @ApiResponse({ status: 200, description: 'Website deleted' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async delete(@Param('id') id: string, @Session() session: UserSession): Promise<void> {
    return this.websiteService.delete(id, session.user.id);
  }
}
