import { WebsiteRecord } from '@app/database/types/website.repository.types';
import { ApiProperty } from '@nestjs/swagger';

export class WebsiteDto {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9' })
  public id!: string;

  @ApiProperty({ example: 'Kreitz Webdev' })
  public name!: string;

  @ApiProperty({ example: 'kreitz-webdev' })
  public slug!: string;

  @ApiProperty({ example: true })
  public enabled!: boolean;

  @ApiProperty({
    example: 'owner@example.com',
    nullable: true,
    description: 'Contact form recipient address. Falls back to the account email when unset.',
  })
  public contactEmail!: string | null;

  @ApiProperty({ example: '2026-08-01T10:00:00.000Z' })
  public createdAt!: Date;

  @ApiProperty({ example: '2026-08-20T09:15:00.000Z' })
  public updatedAt!: Date;

  public static fromRecord(record: WebsiteRecord): WebsiteDto {
    const dto = new WebsiteDto();

    dto.id = record.id;
    dto.name = record.name;
    dto.slug = record.slug;
    dto.enabled = record.enabled;
    dto.contactEmail = record.contactEmail;
    dto.createdAt = record.createdAt;
    dto.updatedAt = record.updatedAt;

    return dto;
  }
}
