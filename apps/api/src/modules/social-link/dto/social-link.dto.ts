import { SocialLinkRecord } from '@app/database/types/social-link.types';
import { ApiProperty } from '@nestjs/swagger';

export class SocialLinkDto {
  @ApiProperty({
    example: 'clx1a2b3c4d5e6f7g8h9i0j1',
  })
  public id!: string;

  @ApiProperty({
    example: 'clx0z9y8x7w6v5u4t3s2r1q0',
  })
  public websiteId!: string;

  @ApiProperty({
    example: 'github',
  })
  public platform!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'GitHub',
  })
  public label!: string | null;

  @ApiProperty({
    example: 'https://github.com/mariokreitz',
  })
  public url!: string;

  @ApiProperty({
    example: 0,
  })
  public sortOrder!: number;

  @ApiProperty()
  public createdAt!: Date;

  @ApiProperty()
  public updatedAt!: Date;

  public static fromRecord(record: SocialLinkRecord): SocialLinkDto {
    const dto = new SocialLinkDto();

    dto.id = record.id;
    dto.websiteId = record.websiteId;
    dto.platform = record.platform;
    dto.label = record.label;
    dto.url = record.url;
    dto.sortOrder = record.sortOrder;
    dto.createdAt = record.createdAt;
    dto.updatedAt = record.updatedAt;

    return dto;
  }
}
