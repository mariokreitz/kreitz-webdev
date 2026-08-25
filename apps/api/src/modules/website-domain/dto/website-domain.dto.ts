import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { ApiProperty } from '@nestjs/swagger';

export class WebsiteDomainDto {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9' })
  public id!: string;

  @ApiProperty({ example: 'clx0z9y8x7w6v5u4t3s2' })
  public websiteId!: string;

  @ApiProperty({ example: 'mario.dev' })
  public domain!: string;

  @ApiProperty({ example: false })
  public verified!: boolean;

  @ApiProperty({ example: '2026-08-20T09:15:00.000Z', nullable: true })
  public verifiedAt!: Date | null;

  @ApiProperty({ example: 'qk3v9z8f1x2c4b6n8m0l7p5q3r1s9t7u5v3w1x9y7z5a3b1c' })
  public verificationToken!: string;

  @ApiProperty({ example: '2026-08-01T10:00:00.000Z' })
  public createdAt!: Date;

  @ApiProperty({ example: '2026-08-20T09:15:00.000Z' })
  public updatedAt!: Date;

  public static fromRecord(record: WebsiteDomainRecord): WebsiteDomainDto {
    const dto = new WebsiteDomainDto();

    dto.id = record.id;
    dto.websiteId = record.websiteId;
    dto.domain = record.domain;
    dto.verified = record.verified;
    dto.verifiedAt = record.verifiedAt;
    dto.verificationToken = record.verificationToken;
    dto.createdAt = record.createdAt;
    dto.updatedAt = record.updatedAt;

    return dto;
  }
}
