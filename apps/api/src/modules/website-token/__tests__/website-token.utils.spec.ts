import { generateWebsiteToken, hashWebsiteToken } from '../utils/website-token.utils';

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
