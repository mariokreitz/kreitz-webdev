import type { PublicProjectRecord } from '@app/database/types/public-project.types';

import { ApiProperty } from '@nestjs/swagger';

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

  public static fromRecord(record: PublicProjectRecord): PublicProjectDto {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      repoUrl: record.repoUrl,
      liveUrl: record.liveUrl,
      tags: record.tags,
      imageUrl: record.imageUrl,
    };
  }
}
