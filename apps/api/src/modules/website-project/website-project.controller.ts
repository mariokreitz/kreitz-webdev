import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { SkipResponseEnvelope } from '@app/common/decorators/skip-response-envelope.decorator';
import { WebsiteProjectService } from '@app/modules/website-project/website-project.service';

import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Session, UserSession } from '@thallesp/nestjs-better-auth';

import { CreateWebsiteProjectDto } from './dto/create-website-project.dto';
import { UpdateWebsiteProjectDto } from './dto/update-website-project.dto';
import { WebsiteProjectDto, WebsiteProjectWithProjectDto } from './dto/website-project.dto';

@ApiTags('Website Projects')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@UseGuards(ArcjetRateLimitGuard)
@Controller('websites/:websiteId/projects')
export class WebsiteProjectController {
  constructor(private readonly websiteProjectService: WebsiteProjectService) {}

  @Get()
  @ApiOperation({ summary: 'Get all project links for a website, published and unpublished' })
  @ApiResponse({
    status: 200,
    description: 'Project links for the website',
    type: WebsiteProjectWithProjectDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async getAll(
    @Param('websiteId') websiteId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteProjectWithProjectDto[]> {
    const links = await this.websiteProjectService.getAllForUser(websiteId, session.user.id);

    return links.map((link) => WebsiteProjectWithProjectDto.fromRecordWithProject(link));
  }

  @Post()
  @ApiOperation({ summary: 'Link an existing project to a website' })
  @ApiResponse({ status: 201, description: 'The created website project link', type: WebsiteProjectDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website or project not found' })
  @ApiResponse({ status: 409, description: 'This project is already linked to this website' })
  public async create(
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateWebsiteProjectDto,
    @Session() session: UserSession,
  ): Promise<WebsiteProjectDto> {
    const created = await this.websiteProjectService.create(
      websiteId,
      session.user.id,
      dto.projectId,
      dto.published,
      dto.sortOrder,
    );

    return WebsiteProjectDto.fromRecord(created);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update the published state and/or sort order of a website project link' })
  @ApiResponse({ status: 200, description: 'The updated website project link', type: WebsiteProjectDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website or website project link not found' })
  public async update(
    @Param('websiteId') websiteId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateWebsiteProjectDto,
    @Session() session: UserSession,
  ): Promise<WebsiteProjectDto> {
    const updated = await this.websiteProjectService.update(websiteId, projectId, session.user.id, dto);

    return WebsiteProjectDto.fromRecord(updated);
  }

  @Delete(':projectId')
  @HttpCode(204)
  @SkipResponseEnvelope()
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
