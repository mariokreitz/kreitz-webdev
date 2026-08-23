import { ProjectRecord } from '@app/database/types/project.types';
import { CreateProjectDto } from '@app/modules/project/dto/create-project.dto';
import { UpdateProjectDto } from '@app/modules/project/dto/update-project.dto';
import { ProjectService } from '@app/modules/project/project.service';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Projects')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all projects belonging to the current user',
  })
  @ApiResponse({ status: 200, description: 'Projects for the current user' })
  public async getAll(@Session() session: UserSession): Promise<ProjectRecord[]> {
    return this.projectService.getAllForUser(session.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a project belonging to the current user',
  })
  @ApiResponse({ status: 200, description: 'The requested project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  public async getById(@Param('id') id: string, @Session() session: UserSession): Promise<ProjectRecord> {
    return this.projectService.getByIdForUser(id, session.user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a project',
  })
  @ApiResponse({ status: 201, description: 'The created project' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'GitHub project already imported' })
  public async create(@Body() dto: CreateProjectDto, @Session() session: UserSession): Promise<ProjectRecord> {
    return this.projectService.create({
      userId: session.user.id,
      name: dto.name,

      ...(dto.description !== undefined && {
        description: dto.description,
      }),

      ...(dto.repoUrl !== undefined && {
        repoUrl: dto.repoUrl,
      }),

      ...(dto.liveUrl !== undefined && {
        liveUrl: dto.liveUrl,
      }),

      ...(dto.tags !== undefined && {
        tags: dto.tags,
      }),

      ...(dto.imageUrl !== undefined && {
        imageUrl: dto.imageUrl,
      }),

      ...(dto.githubId !== undefined && {
        githubId: dto.githubId,
      }),

      ...(dto.githubOwner !== undefined && {
        githubOwner: dto.githubOwner,
      }),

      ...(dto.githubRepo !== undefined && {
        githubRepo: dto.githubRepo,
      }),
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a project',
  })
  @ApiResponse({ status: 200, description: 'The updated project' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'GitHub project already imported' })
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Session() session: UserSession,
  ): Promise<ProjectRecord> {
    return this.projectService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a project',
  })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  public async delete(@Param('id') id: string, @Session() session: UserSession): Promise<void> {
    return this.projectService.delete(id, session.user.id);
  }
}
