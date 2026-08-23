import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';

import { CreatedWebsiteTokenResponse } from '../dto/created-website-token.response';

describe('CreatedWebsiteTokenResponse.fromRecordAndSecret', () => {
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

  const plaintextToken = 'wst_live_a3f9x2b1QqZ1k7htN2eF9pR4sV6wY8xB0cD2gH4jL6mN8pQ';

  it('never includes tokenHash or websiteId in the created response', () => {
    const response = CreatedWebsiteTokenResponse.fromRecordAndSecret(record, plaintextToken);

    expect(response).not.toHaveProperty('tokenHash');
    expect(response).not.toHaveProperty('websiteId');
    expect(response).not.toHaveProperty('lastUsedAt');
  });

  it('embeds the plaintext token, which the record never carries', () => {
    const response = CreatedWebsiteTokenResponse.fromRecordAndSecret(record, plaintextToken);

    expect(response.token).toBe(plaintextToken);
  });

  it('preserves every allow-listed record field', () => {
    const response = CreatedWebsiteTokenResponse.fromRecordAndSecret(record, plaintextToken);

    expect(response).toEqual({
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      token: plaintextToken,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    });
  });
});
