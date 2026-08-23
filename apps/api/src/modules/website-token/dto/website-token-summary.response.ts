import { ApiProperty } from '@nestjs/swagger';

export class WebsiteTokenSummaryResponse {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9' })
  public id!: string;

  @ApiProperty({ example: 'clx0z9y8x7w6v5u4t3s2' })
  public websiteId!: string;

  @ApiProperty({ example: 'Production Website' })
  public name!: string;

  @ApiProperty({ example: 'wst_live_a3f9x2b1' })
  public prefix!: string;

  @ApiProperty({ example: '2027-08-23T00:00:00.000Z', nullable: true })
  public expiresAt!: Date | null;

  @ApiProperty({ example: '2026-08-20T09:15:00.000Z', nullable: true })
  public lastUsedAt!: Date | null;

  @ApiProperty({ example: '2026-08-01T10:00:00.000Z' })
  public createdAt!: Date;

  @ApiProperty({ example: '2026-08-20T09:15:00.000Z' })
  public updatedAt!: Date;
}
