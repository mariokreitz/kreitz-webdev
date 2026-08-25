import { ProjectRecord } from '@app/database/types/project.types';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectCategory } from '../../../../generated/prisma/enums';

export class ProjectDto {
  @ApiProperty({
    example: 'clx1a2b3c4d5e6f7g8h9i0j1',
  })
  public id!: string;

  @ApiProperty({
    example: 'clx0a1b2c3d4e5f6g7h8i9j0',
  })
  public userId!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '123456789',
  })
  public githubId!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'mariokreitz',
  })
  public githubOwner!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'my-project',
  })
  public githubRepo!: string | null;

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

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-08-25T12:00:00.000Z',
  })
  public lastSyncedAt!: string | null;

  @ApiProperty()
  public importedAt!: Date;

  @ApiProperty()
  public updatedAt!: Date;

  public static fromRecord(record: ProjectRecord): ProjectDto {
    const dto = new ProjectDto();

    dto.id = record.id;
    dto.userId = record.userId;
    dto.githubId = record.githubId;
    dto.githubOwner = record.githubOwner;
    dto.githubRepo = record.githubRepo;
    dto.name = record.name;
    dto.description = record.description;
    dto.repoUrl = record.repoUrl;
    dto.liveUrl = record.liveUrl;
    dto.tags = record.tags;
    dto.imageUrl = record.imageUrl;
    dto.category = record.category;
    dto.githubStars = record.githubStars;
    dto.githubCreatedAt = record.githubCreatedAt?.toISOString() ?? null;
    dto.githubUpdatedAt = record.githubUpdatedAt?.toISOString() ?? null;
    dto.lastSyncedAt = record.lastSyncedAt?.toISOString() ?? null;
    dto.importedAt = record.importedAt;
    dto.updatedAt = record.updatedAt;

    return dto;
  }
}
