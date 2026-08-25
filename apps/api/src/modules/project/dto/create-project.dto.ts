import type { CreateProjectData } from '@app/database/types/project.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ProjectCategory } from '../../../../generated/prisma/enums';

export class CreateProjectDto {
  @ApiProperty({
    example: 'My awesome project',
  })
  @IsString()
  @MaxLength(200)
  public name!: string;

  @ApiPropertyOptional({
    example: 'A project description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  public description?: string;

  @ApiPropertyOptional({
    example: 'https://github.com/mariokreitz/my-project',
  })
  @IsOptional()
  @IsUrl()
  public repoUrl?: string;

  @ApiPropertyOptional({
    example: 'https://myproject.dev',
  })
  @IsOptional()
  @IsUrl()
  public liveUrl?: string;

  @ApiPropertyOptional({
    example: ['Angular', 'NestJS'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  public tags?: string[];

  @ApiPropertyOptional({
    example: 'https://example.com/project.png',
  })
  @IsOptional()
  @IsUrl()
  public imageUrl?: string;

  @ApiPropertyOptional({
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  public githubId?: string;

  @ApiPropertyOptional({
    example: 'mariokreitz',
  })
  @IsOptional()
  @IsString()
  public githubOwner?: string;

  @ApiPropertyOptional({
    example: 'my-project',
  })
  @IsOptional()
  @IsString()
  public githubRepo?: string;

  @ApiPropertyOptional({
    enum: ProjectCategory,
    enumName: 'ProjectCategory',
    example: ProjectCategory.OPEN_SOURCE,
  })
  @IsOptional()
  @IsEnum(ProjectCategory)
  public category?: ProjectCategory;

  public toCreateProjectData(userId: string): CreateProjectData {
    return {
      userId,
      name: this.name,

      ...(this.description !== undefined && { description: this.description }),
      ...(this.repoUrl !== undefined && { repoUrl: this.repoUrl }),
      ...(this.liveUrl !== undefined && { liveUrl: this.liveUrl }),
      ...(this.tags !== undefined && { tags: this.tags }),
      ...(this.imageUrl !== undefined && { imageUrl: this.imageUrl }),
      ...(this.githubId !== undefined && { githubId: this.githubId }),
      ...(this.githubOwner !== undefined && { githubOwner: this.githubOwner }),
      ...(this.githubRepo !== undefined && { githubRepo: this.githubRepo }),
      ...(this.category !== undefined && { category: this.category }),
    };
  }
}
