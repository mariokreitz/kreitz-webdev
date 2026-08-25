import type { WebsiteDomainSummaryRecord } from '@app/database/types/website-domain-summary.types';

import { DomainsSummaryResponse } from '../dto/domains-summary.response';

describe('DomainsSummaryResponse.fromRecord', () => {
  it('maps total and verified from the record', () => {
    const record: WebsiteDomainSummaryRecord = { total: 5, verified: 3 };

    const response = DomainsSummaryResponse.fromRecord(record);

    expect(response).toEqual({ total: 5, verified: 3 });
  });

  it('exposes exactly total and verified, never leaking an extra field from the record', () => {
    const record = { total: 5, verified: 3, internalNote: 'never expose this' } as WebsiteDomainSummaryRecord;

    const response = DomainsSummaryResponse.fromRecord(record);

    expect(Object.keys(response)).toEqual(['total', 'verified']);
  });

  it('maps zero counts as-is', () => {
    const record: WebsiteDomainSummaryRecord = { total: 0, verified: 0 };

    const response = DomainsSummaryResponse.fromRecord(record);

    expect(response).toEqual({ total: 0, verified: 0 });
  });
});
