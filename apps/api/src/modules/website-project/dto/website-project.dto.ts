import { WebsiteProjectRecord, WebsiteProjectWithProjectRecord } from '@app/database/types/website-project.types';
import { ProjectDto } from '@app/modules/project';
import { ApiProperty } from '@nestjs/swagger';

export class WebsiteProjectDto {
  @ApiProperty({
    example: 'clx1a2b3c4d5e6f7g8h9i0j1',
  })
  public id!: string;

  @ApiProperty({
    example: 'clx2a3b4c5d6e7f8g9h0i1j2',
  })
  public websiteId!: string;

  @ApiProperty({
    example: 'clx1a2b3c4d5e6f7g8h9i0j1',
  })
  public projectId!: string;

  @ApiProperty({
    example: false,
  })
  public published!: boolean;

  @ApiProperty({
    example: 0,
  })
  public sortOrder!: number;

  @ApiProperty()
  public createdAt!: Date;

  @ApiProperty()
  public updatedAt!: Date;

  public static fromRecord(record: WebsiteProjectRecord): WebsiteProjectDto {
    const dto = new WebsiteProjectDto();

    dto.id = record.id;
    dto.websiteId = record.websiteId;
    dto.projectId = record.projectId;
    dto.published = record.published;
    dto.sortOrder = record.sortOrder;
    dto.createdAt = record.createdAt;
    dto.updatedAt = record.updatedAt;

    return dto;
  }
}

export class WebsiteProjectWithProjectDto extends WebsiteProjectDto {
  @ApiProperty({ type: ProjectDto })
  public project!: ProjectDto;

  public static fromRecordWithProject(record: WebsiteProjectWithProjectRecord): WebsiteProjectWithProjectDto {
    const dto = new WebsiteProjectWithProjectDto();

    dto.id = record.id;
    dto.websiteId = record.websiteId;
    dto.projectId = record.projectId;
    dto.published = record.published;
    dto.sortOrder = record.sortOrder;
    dto.createdAt = record.createdAt;
    dto.updatedAt = record.updatedAt;
    dto.project = ProjectDto.fromRecord(record.project);

    return dto;
  }
}
