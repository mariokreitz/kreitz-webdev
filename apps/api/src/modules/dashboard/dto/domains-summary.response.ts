import type { WebsiteDomainSummaryRecord } from '@app/database/types/website-domain-summary.types';

import { ApiProperty } from '@nestjs/swagger';

export class DomainsSummaryResponse {
  @ApiProperty({
    example: 5,
    description: 'Total number of domains registered across the enabled websites owned by the current user',
  })
  public total!: number;

  @ApiProperty({
    example: 3,
    description: 'Number of those domains that have completed ownership verification',
  })
  public verified!: number;

  public static fromRecord(record: WebsiteDomainSummaryRecord): DomainsSummaryResponse {
    const response = new DomainsSummaryResponse();

    response.total = record.total;
    response.verified = record.verified;

    return response;
  }
}
