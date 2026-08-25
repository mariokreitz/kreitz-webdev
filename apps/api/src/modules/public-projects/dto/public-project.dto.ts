import type { PublicProjectRecord } from '@app/database/types/public-project.types';

import { ApiProperty } from '@nestjs/swagger';
import { ProjectCategory } from '../../../../generated/prisma/enums';

export class PublicProjectDto {
  @ApiProperty({
    example: 'clx1a2b3c4d5e6f7g8h9i0j1',
  })
  public id!: string;

  @ApiProperty({
    example: 'My awesome project',
  })
  public name!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'A project description',
  })
  public description!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://github.com/mariokreitz/my-project',
  })
  public repoUrl!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://myproject.dev',
  })
  public liveUrl!: string | null;

  @ApiProperty({
    type: [String],
    example: ['Angular', 'NestJS'],
  })
  public tags!: string[];

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://example.com/project.png',
  })
  public imageUrl!: string | null;

  @ApiProperty({
    enum: ProjectCategory,
    enumName: 'ProjectCategory',
    nullable: true,
    example: ProjectCategory.OPEN_SOURCE,
  })
  public category!: ProjectCategory | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 128,
  })
  public githubStars!: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-01-01T00:00:00.000Z',
  })
  public githubCreatedAt!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-08-20T09:15:00.000Z',
  })
  public githubUpdatedAt!: string | null;

  public static fromRecord(record: PublicProjectRecord): PublicProjectDto {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      repoUrl: record.repoUrl,
      liveUrl: record.liveUrl,
      tags: record.tags,
      imageUrl: record.imageUrl,
      category: record.category,
      githubStars: record.githubStars,
      githubCreatedAt: record.githubCreatedAt?.toISOString() ?? null,
      githubUpdatedAt: record.githubUpdatedAt?.toISOString() ?? null,
    };
  }
}
