import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';

import { generateWebsiteToken, hashWebsiteToken, toWebsiteTokenSummary } from '../utils/website-token.utils';

describe('generateWebsiteToken', () => {
  it('produces a prefix that distinguishes it from the bare constant', () => {
    const generated = generateWebsiteToken();

    expect(generated.prefix).toMatch(/^wst_live_[A-Za-z0-9_-]{8}$/);
    expect(generated.prefix).not.toBe('wst_live_');
  });

  it('produces a token that starts with the generated prefix', () => {
    const generated = generateWebsiteToken();

    expect(generated.token.startsWith(generated.prefix)).toBe(true);
  });

  it('produces different prefixes across calls', () => {
    const first = generateWebsiteToken();
    const second = generateWebsiteToken();

    expect(first.prefix).not.toBe(second.prefix);
  });

  it('hashes the returned token consistently with hashWebsiteToken', () => {
    const generated = generateWebsiteToken();

    expect(generated.tokenHash).toBe(hashWebsiteToken(generated.token));
  });
});

describe('toWebsiteTokenSummary', () => {
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
    const summary = toWebsiteTokenSummary(record);

    expect(Object.keys(summary)).not.toContain('tokenHash');
    expect(summary).not.toHaveProperty('tokenHash');
  });

  it('preserves every allow-listed field', () => {
    const summary = toWebsiteTokenSummary(record);

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
