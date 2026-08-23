import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';

import { WebsiteTokenSummaryResponse } from '../dto/website-token-summary.response';

describe('WebsiteTokenSummaryResponse.fromRecord', () => {
  const record: WebsiteTokenRecord = {
    id: 'token-id',
    websiteId: 'website-id',
    name: 'Production Website',
    prefix: 'wst_live_a3f9x2b1',
    tokenHash: 'super-secret-hash',
    expiresAt: null,
    lastUsedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  it('never includes tokenHash in the mapped summary', () => {
    const summary = WebsiteTokenSummaryResponse.fromRecord(record);

    expect(Object.keys(summary)).not.toContain('tokenHash');
    expect(summary).not.toHaveProperty('tokenHash');
  });

  it('preserves every allow-listed field', () => {
    const summary = WebsiteTokenSummaryResponse.fromRecord(record);

    expect(summary).toEqual({
      id: record.id,
      websiteId: record.websiteId,
      name: record.name,
      prefix: record.prefix,
      expiresAt: record.expiresAt,
      lastUsedAt: record.lastUsedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  });
});
