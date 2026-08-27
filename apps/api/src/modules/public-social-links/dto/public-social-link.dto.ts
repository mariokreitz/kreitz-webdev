import type { PublicSocialLinkRecord } from '@app/database/types/public-social-link.types';

import { ApiProperty } from '@nestjs/swagger';

export class PublicSocialLinkDto {
  @ApiProperty({
    example: 'clx1a2b3c4d5e6f7g8h9i0j1',
  })
  public id!: string;

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

  public static fromRecord(record: PublicSocialLinkRecord): PublicSocialLinkDto {
    return {
      id: record.id,
      platform: record.platform,
      label: record.label,
      url: record.url,
      sortOrder: record.sortOrder,
    };
  }
}
