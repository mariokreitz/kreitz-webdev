import { normalizeRepoUrl } from '@app/modules/project/utils/normalize-repo-url';

describe('normalizeRepoUrl', () => {
  it('strips a trailing slash', () => {
    expect(normalizeRepoUrl('https://github.com/owner/repo/')).toBe('github.com/owner/repo');
  });

  it('strips the https scheme', () => {
    expect(normalizeRepoUrl('https://github.com/owner/repo')).toBe('github.com/owner/repo');
  });

  it('strips the http scheme, treating it the same as https', () => {
    expect(normalizeRepoUrl('http://github.com/owner/repo')).toBe('github.com/owner/repo');
  });

  it('lowercases the URL', () => {
    expect(normalizeRepoUrl('https://GitHub.com/Owner/Repo')).toBe('github.com/owner/repo');
  });

  it('treats a mix of trailing slash, scheme, and case differences as the same URL', () => {
    const first = normalizeRepoUrl('https://github.com/Owner/Repo/');
    const second = normalizeRepoUrl('http://github.com/owner/repo');

    expect(first).toBe(second);
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeRepoUrl('  https://github.com/owner/repo  ')).toBe('github.com/owner/repo');
  });

  it('does not equate genuinely different repository URLs', () => {
    const first = normalizeRepoUrl('https://github.com/owner/repo-one');
    const second = normalizeRepoUrl('https://github.com/owner/repo-two');

    expect(first).not.toBe(second);
  });
});
