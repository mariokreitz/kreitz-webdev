import type { WebsiteDomainRecord } from '@app/database/types/website-domain.types';

import { WebsiteDomainVerificationResponse } from '../dto/website-domain-verification.response';

describe('WebsiteDomainVerificationResponse.fromRecordAndOutcome', () => {
  const record: WebsiteDomainRecord = {
    id: 'domain-id',
    websiteId: 'website-id',
    domain: 'mario.dev',
    verified: true,
    verifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    verificationToken: 'verification-token-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  it('maps every field from the record and carries a null failureReason for the success case', () => {
    const response = WebsiteDomainVerificationResponse.fromRecordAndOutcome(record, null);

    expect(response).toEqual({
      id: record.id,
      websiteId: record.websiteId,
      domain: record.domain,
      verified: record.verified,
      verifiedAt: record.verifiedAt,
      failureReason: null,
    });
  });

  it('maps every field from the record and carries the non-null failureReason for the failure case', () => {
    const unverifiedRecord: WebsiteDomainRecord = { ...record, verified: false, verifiedAt: null };

    const response = WebsiteDomainVerificationResponse.fromRecordAndOutcome(unverifiedRecord, 'token_mismatch');

    expect(response).toEqual({
      id: unverifiedRecord.id,
      websiteId: unverifiedRecord.websiteId,
      domain: unverifiedRecord.domain,
      verified: false,
      verifiedAt: null,
      failureReason: 'token_mismatch',
    });
  });
});
