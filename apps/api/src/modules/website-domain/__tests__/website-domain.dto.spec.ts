import type { WebsiteDomainRecord } from '@app/database/types/website-domain.types';

import { WebsiteDomainDto } from '../dto/website-domain.dto';

describe('WebsiteDomainDto.fromRecord', () => {
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

  it('preserves every field', () => {
    const dto = WebsiteDomainDto.fromRecord(record);

    expect(dto).toEqual({
      id: record.id,
      websiteId: record.websiteId,
      domain: record.domain,
      verified: record.verified,
      verifiedAt: record.verifiedAt,
      verificationToken: record.verificationToken,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  });
});
