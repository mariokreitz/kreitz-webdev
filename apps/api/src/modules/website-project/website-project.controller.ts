import { WebsiteProjectRecord, WebsiteProjectWithProjectRecord } from '@app/database/types/website-project.types';
import { WebsiteProjectService } from '@app/modules/website-project/website-project.service';

import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Session, UserSession } from '@thallesp/nestjs-better-auth';

import { CreateWebsiteProjectDto } from './dto/create-website-project.dto';
import { UpdateWebsiteProjectDto } from './dto/update-website-project.dto';

@ApiTags('Website Projects')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@Controller('websites/:websiteId/projects')
export class WebsiteProjectController {
  constructor(private readonly websiteProjectService: WebsiteProjectService) {}

  @Get()
  @ApiOperation({ summary: 'Get all project links for a website, published and unpublished' })
  @ApiResponse({ status: 200, description: 'Project links for the website' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async getAll(
    @Param('websiteId') websiteId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteProjectWithProjectRecord[]> {
    return this.websiteProjectService.getAllForUser(websiteId, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Link an existing project to a website' })
  @ApiResponse({ status: 201, description: 'The created website project link' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website or project not found' })
  @ApiResponse({ status: 409, description: 'This project is already linked to this website' })
  public async create(
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateWebsiteProjectDto,
    @Session() session: UserSession,
  ): Promise<WebsiteProjectRecord> {
    return this.websiteProjectService.create(websiteId, session.user.id, dto.projectId, dto.published, dto.sortOrder);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update the published state and/or sort order of a website project link' })
  @ApiResponse({ status: 200, description: 'The updated website project link' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website or website project link not found' })
  public async update(
    @Param('websiteId') websiteId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateWebsiteProjectDto,
    @Session() session: UserSession,
  ): Promise<WebsiteProjectRecord> {
    return this.websiteProjectService.update(websiteId, projectId, session.user.id, dto);
  }

  @Delete(':projectId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Unlink a project from a website',
    description: 'Removes the website/project association only. The underlying project itself is not deleted.',
  })
  @ApiResponse({ status: 204, description: 'Website project link deleted' })
  @ApiResponse({ status: 404, description: 'Website or website project link not found' })
  public async delete(
    @Param('websiteId') websiteId: string,
    @Param('projectId') projectId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.websiteProjectService.delete(websiteId, projectId, session.user.id);
  }
}
