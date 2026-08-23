import type { GithubRepoApiResponse } from '@app/modules/github-import/types/github-api.types';
import { ApiProperty } from '@nestjs/swagger';

export class GithubRepoSummaryResponse {
  @ApiProperty({ example: '123456789' })
  public githubId!: string;

  @ApiProperty({ example: 'my-project' })
  public name!: string;

  @ApiProperty({ example: 'mariokreitz/my-project' })
  public fullName!: string;

  @ApiProperty({ example: 'https://github.com/mariokreitz/my-project' })
  public htmlUrl!: string;

  @ApiProperty({ example: 'A project description', nullable: true })
  public description!: string | null;

  @ApiProperty({ example: 'https://myproject.dev', nullable: true })
  public homepage!: string | null;

  @ApiProperty({ example: 'TypeScript', nullable: true })
  public language!: string | null;

  @ApiProperty({ example: ['cli', 'typescript'], type: [String] })
  public topics!: string[];

  @ApiProperty({ example: false })
  public private!: boolean;

  @ApiProperty({ example: '2026-08-20T09:15:00.000Z' })
  public updatedAt!: string;

  public static fromApiResponse(repo: GithubRepoApiResponse): GithubRepoSummaryResponse {
    const dto = new GithubRepoSummaryResponse();

    dto.githubId = String(repo.id);
    dto.name = repo.name;
    dto.fullName = repo.full_name;
    dto.htmlUrl = repo.html_url;
    dto.description = repo.description;
    dto.homepage = repo.homepage;
    dto.language = repo.language;
    dto.topics = repo.topics;
    dto.private = repo.private;
    dto.updatedAt = repo.updated_at;

    return dto;
  }
}
