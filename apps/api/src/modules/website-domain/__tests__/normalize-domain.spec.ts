import { normalizeDomain } from '../utils/normalize-domain';

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

  it('strips a trailing dot (FQDN root)', () => {
    expect(normalizeDomain('example.com.')).toBe('example.com');
  });

  it('strips a trailing port before stripping the trailing dot', () => {
    expect(normalizeDomain('example.com.:4200')).toBe('example.com');
  });

  it('combines scheme, path, and trailing slash in one pass', () => {
    expect(normalizeDomain('https://www.kreitz-webdev.de/')).toBe('www.kreitz-webdev.de');
  });

  it('leaves non-string values untouched', () => {
    expect(normalizeDomain(42)).toBe(42);
    expect(normalizeDomain(undefined)).toBeUndefined();
  });
});
