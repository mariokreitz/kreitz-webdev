import { generateVerificationToken } from '../generate-verification-token';

describe('generateVerificationToken', () => {
  it('returns a base64url-encoded string of the expected length for 32 random bytes', () => {
    const token = generateVerificationToken();

    expect(typeof token).toBe('string');
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('produces a different value on every call, since there is no fixed seed', () => {
    const first = generateVerificationToken();
    const second = generateVerificationToken();

    expect(first).not.toBe(second);
  });
});
