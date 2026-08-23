import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateWebsiteDomainDto, normalizeDomain } from '../dto/create-website-domain.dto';

describe('normalizeDomain', () => {
  it('trims whitespace', () => {
    expect(normalizeDomain('  mario.dev  ')).toBe('mario.dev');
  });

  it('lowercases the value', () => {
    expect(normalizeDomain('Mario.DEV')).toBe('mario.dev');
  });

  it('strips a leading http:// or https:// scheme', () => {
    expect(normalizeDomain('http://mario.dev')).toBe('mario.dev');
    expect(normalizeDomain('https://mario.dev')).toBe('mario.dev');
  });

  it('strips a path, query, or fragment', () => {
    expect(normalizeDomain('mario.dev/path')).toBe('mario.dev');
    expect(normalizeDomain('mario.dev?query=1')).toBe('mario.dev');
    expect(normalizeDomain('mario.dev#fragment')).toBe('mario.dev');
  });

  it('strips a trailing port', () => {
    expect(normalizeDomain('localhost:4200')).toBe('localhost');
  });

  it('combines scheme, path, and trailing slash in one pass', () => {
    expect(normalizeDomain('https://www.kreitz-webdev.de/')).toBe('www.kreitz-webdev.de');
  });

  it('leaves non-string values untouched', () => {
    expect(normalizeDomain(42)).toBe(42);
    expect(normalizeDomain(undefined)).toBeUndefined();
  });
});

async function validateDomain(rawValue: unknown): Promise<{ value: unknown; errorCount: number }> {
  const instance = plainToInstance(CreateWebsiteDomainDto, { domain: rawValue });
  const errors = await validate(instance);

  return { value: instance.domain, errorCount: errors.length };
}

describe('CreateWebsiteDomainDto', () => {
  it('accepts the literal "localhost"', async () => {
    const { value, errorCount } = await validateDomain('localhost');

    expect(value).toBe('localhost');
    expect(errorCount).toBe(0);
  });

  it('accepts a standard multi-label domain', async () => {
    const { value, errorCount } = await validateDomain('mario.dev');

    expect(value).toBe('mario.dev');
    expect(errorCount).toBe(0);
  });

  it('normalizes then accepts a pasted URL with scheme and trailing slash', async () => {
    const { value, errorCount } = await validateDomain('https://www.kreitz-webdev.de/');

    expect(value).toBe('www.kreitz-webdev.de');
    expect(errorCount).toBe(0);
  });

  it('rejects a single-label host that is not "localhost"', async () => {
    const { errorCount } = await validateDomain('internal');

    expect(errorCount).toBeGreaterThan(0);
  });

  it('strips a trailing port before validating, so it validates as the bare hostname', async () => {
    const { value, errorCount } = await validateDomain('mario.dev:4200');

    expect(value).toBe('mario.dev');
    expect(errorCount).toBe(0);
  });

  it('rejects an empty string', async () => {
    const { errorCount } = await validateDomain('');

    expect(errorCount).toBeGreaterThan(0);
  });
});
