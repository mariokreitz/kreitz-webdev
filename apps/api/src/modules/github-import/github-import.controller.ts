import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { GithubRepoSummaryResponse } from '@app/modules/github-import/dto/github-repo-summary.response';
import { ImportGithubRepoDto } from '@app/modules/github-import/dto/import-github-repo.dto';
import { GithubImportService } from '@app/modules/github-import/github-import.service';
import { ProjectDto } from '@app/modules/project';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('GitHub Import')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@UseGuards(ArcjetRateLimitGuard)
@Controller('projects/github')
export class GithubImportController {
  constructor(private readonly githubImportService: GithubImportService) {}

  @Get('repos')
  @ApiOperation({ summary: "List the current user's GitHub repositories, including private ones" })
  @ApiResponse({ status: 200, type: [GithubRepoSummaryResponse] })
  @ApiResponse({ status: 400, description: 'No linked GitHub account' })
  @ApiResponse({ status: 429, description: 'GitHub API rate limit exceeded' })
  public async listRepos(@Session() session: UserSession): Promise<GithubRepoSummaryResponse[]> {
    return this.githubImportService.listRepos(session.user.id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import a GitHub repository as a project' })
  @ApiResponse({ status: 201, description: 'The created project', type: ProjectDto })
  @ApiResponse({ status: 400, description: 'Validation failed, no linked GitHub account, or githubId mismatch' })
  @ApiResponse({ status: 404, description: 'GitHub repository not found or not accessible' })
  @ApiResponse({ status: 409, description: 'GitHub project already imported' })
  @ApiResponse({ status: 429, description: 'GitHub API rate limit exceeded' })
  public async import(@Body() dto: ImportGithubRepoDto, @Session() session: UserSession): Promise<ProjectDto> {
    const created = await this.githubImportService.importRepo(session.user.id, dto.githubId, dto.owner, dto.repo);

    return ProjectDto.fromRecord(created);
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: "Re-fetch a project's linked GitHub repository and refresh its stored metadata" })
  @ApiResponse({ status: 200, description: 'The updated project', type: ProjectDto })
  @ApiResponse({ status: 400, description: 'Project is not linked to a GitHub repository, or githubId mismatch' })
  @ApiResponse({ status: 404, description: 'Project not found, or GitHub repository not found or not accessible' })
  @ApiResponse({ status: 429, description: 'GitHub API rate limit exceeded' })
  public async refresh(@Param('id') id: string, @Session() session: UserSession): Promise<ProjectDto> {
    const updated = await this.githubImportService.refreshRepo(session.user.id, id);

    return ProjectDto.fromRecord(updated);
  }
}
