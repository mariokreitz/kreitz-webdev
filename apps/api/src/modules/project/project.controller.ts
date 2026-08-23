import { ProjectRecord } from '@app/database/types/project.types';
import { CreateProjectDto } from '@app/modules/project/dto/create-project.dto';
import { UpdateProjectDto } from '@app/modules/project/dto/update-project.dto';
import { ProjectService } from '@app/modules/project/project.service';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all projects belonging to the current user',
  })
  @ApiResponse({
    status: 200,
    type: [Object],
  })
  public async getAll(@Session() session: UserSession): Promise<ProjectRecord[]> {
    return this.projectService.getAllForUser(session.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a project belonging to the current user',
  })
  public async getById(@Param('id') id: string, @Session() session: UserSession): Promise<ProjectRecord> {
    return this.projectService.getByIdForUser(id, session.user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a project',
  })
  public async create(@Body() dto: CreateProjectDto, @Session() session: UserSession): Promise<ProjectRecord> {
    return this.projectService.create({
      userId: session.user.id,
      name: dto.name,

      ...(dto.description !== undefined && {
        description: dto.description,
      }),

      ...(dto.url !== undefined && {
        url: dto.url,
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
  public async delete(@Param('id') id: string, @Session() session: UserSession): Promise<void> {
    return this.projectService.delete(id, session.user.id);
  }
}
