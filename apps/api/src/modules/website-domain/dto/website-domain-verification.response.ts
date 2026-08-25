import type { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { ApiProperty } from '@nestjs/swagger';

export type WebsiteDomainVerificationFailureReason =
  | 'unreachable'
  | 'blocked_target'
  | 'redirected'
  | 'file_not_found'
  | 'token_mismatch';

export class WebsiteDomainVerificationResponse {
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

  @ApiProperty({
    example: 'token_mismatch',
    nullable: true,
    enum: ['unreachable', 'blocked_target', 'redirected', 'file_not_found', 'token_mismatch'],
  })
  public failureReason!: WebsiteDomainVerificationFailureReason | null;

  public static fromRecordAndOutcome(
    record: WebsiteDomainRecord,
    failureReason: WebsiteDomainVerificationFailureReason | null,
  ): WebsiteDomainVerificationResponse {
    const response = new WebsiteDomainVerificationResponse();

    response.id = record.id;
    response.websiteId = record.websiteId;
    response.domain = record.domain;
    response.verified = record.verified;
    response.verifiedAt = record.verifiedAt;
    response.failureReason = failureReason;

    return response;
  }
}
