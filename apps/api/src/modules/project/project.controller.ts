import { CreateProjectDto } from '@app/modules/project/dto/create-project.dto';
import { ProjectDto } from '@app/modules/project/dto/project.dto';
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
  @ApiResponse({ status: 200, description: 'Projects for the current user', type: ProjectDto, isArray: true })
  public async getAll(@Session() session: UserSession): Promise<ProjectDto[]> {
    const projects = await this.projectService.getAllForUser(session.user.id);

    return projects.map((project) => ProjectDto.fromRecord(project));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a project belonging to the current user',
  })
  @ApiResponse({ status: 200, description: 'The requested project', type: ProjectDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  public async getById(@Param('id') id: string, @Session() session: UserSession): Promise<ProjectDto> {
    const project = await this.projectService.getByIdForUser(id, session.user.id);

    return ProjectDto.fromRecord(project);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a project',
  })
  @ApiResponse({ status: 201, description: 'The created project', type: ProjectDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'GitHub project already imported' })
  public async create(@Body() dto: CreateProjectDto, @Session() session: UserSession): Promise<ProjectDto> {
    const created = await this.projectService.create(dto.toCreateProjectData(session.user.id));

    return ProjectDto.fromRecord(created);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a project',
  })
  @ApiResponse({ status: 200, description: 'The updated project', type: ProjectDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'GitHub project already imported' })
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Session() session: UserSession,
  ): Promise<ProjectDto> {
    const updated = await this.projectService.update(id, session.user.id, dto.toUpdateProjectData());

    return ProjectDto.fromRecord(updated);
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
