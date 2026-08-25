import type { GithubRepoApiResponse } from '../types/github-api.types';
import { buildGithubReposCacheKey, toCreateProjectData, toGithubMetadataUpdate } from '../utils/github-import.utils';

function buildRepo(overrides: Partial<GithubRepoApiResponse> = {}): GithubRepoApiResponse {
  return {
    id: 123,
    name: 'my-project',
    full_name: 'mariokreitz/my-project',
    html_url: 'https://github.com/mariokreitz/my-project',
    description: 'A project description',
    homepage: 'https://myproject.dev',
    language: 'TypeScript',
    topics: ['cli'],
    private: false,
    updated_at: '2026-01-01T00:00:00.000Z',
    pushed_at: '2025-12-30T00:00:00.000Z',
    created_at: '2025-01-01T00:00:00.000Z',
    stargazers_count: 42,
    owner: { id: 999999, login: 'mariokreitz' },
    ...overrides,
  };
}

describe('github-import.utils', () => {
  describe('toCreateProjectData', () => {
    it('omits liveUrl when homepage is null', () => {
      const result = toCreateProjectData('user-a', buildRepo({ homepage: null }));

      expect('liveUrl' in result).toBe(false);
    });

    it('omits liveUrl when homepage is an empty string', () => {
      const result = toCreateProjectData('user-a', buildRepo({ homepage: '' }));

      expect('liveUrl' in result).toBe(false);
    });

    it('omits liveUrl when homepage is not a valid URL', () => {
      const result = toCreateProjectData('user-a', buildRepo({ homepage: 'coming soon' }));

      expect('liveUrl' in result).toBe(false);
    });

    it('omits liveUrl when homepage uses a non-http(s) protocol', () => {
      const result = toCreateProjectData('user-a', buildRepo({ homepage: 'ftp://example.com/file' }));

      expect('liveUrl' in result).toBe(false);
    });

    it('keeps a valid http(s) homepage verbatim, without normalizing it', () => {
      const result = toCreateProjectData('user-a', buildRepo({ homepage: 'https://myproject.dev' }));

      expect(result.liveUrl).toBe('https://myproject.dev');
    });

    it('caps tags at 20 and dedupes language against topics', () => {
      const topics = Array.from({ length: 20 }, (_, index) => `topic-${index}`);

      const result = toCreateProjectData('user-a', buildRepo({ language: 'TypeScript', topics }));

      expect(result.tags).toHaveLength(20);
      expect(result.tags).toEqual(['TypeScript', ...topics.slice(0, 19)]);
    });

    it('dedupes a topic that matches the language', () => {
      const result = toCreateProjectData(
        'user-a',
        buildRepo({ language: 'TypeScript', topics: ['TypeScript', 'cli'] }),
      );

      expect(result.tags).toEqual(['TypeScript', 'cli']);
    });

    it('omits tags entirely when language is null and topics is empty', () => {
      const result = toCreateProjectData('user-a', buildRepo({ language: null, topics: [] }));

      expect('tags' in result).toBe(false);
    });

    it('maps stargazers_count and created_at verbatim, and prefers pushed_at over updated_at for githubUpdatedAt', () => {
      const result = toCreateProjectData(
        'user-a',
        buildRepo({
          stargazers_count: 7,
          created_at: '2025-01-01T00:00:00.000Z',
          pushed_at: '2025-06-01T00:00:00.000Z',
          updated_at: '2025-07-01T00:00:00.000Z',
        }),
      );

      expect(result.githubStars).toBe(7);
      expect(result.githubCreatedAt).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(result.githubUpdatedAt).toEqual(new Date('2025-06-01T00:00:00.000Z'));
      expect(result.lastSyncedAt).toBeInstanceOf(Date);
    });

    it('falls back to updated_at for githubUpdatedAt when pushed_at is null', () => {
      const result = toCreateProjectData(
        'user-a',
        buildRepo({ pushed_at: null, updated_at: '2025-07-01T00:00:00.000Z' }),
      );

      expect(result.githubUpdatedAt).toEqual(new Date('2025-07-01T00:00:00.000Z'));
    });
  });

  describe('toGithubMetadataUpdate', () => {
    it('maps the same GitHub metadata fields as toCreateProjectData, without the project-creation fields', () => {
      const result = toGithubMetadataUpdate(buildRepo({ stargazers_count: 99 }));

      expect(result).toEqual({
        githubStars: 99,
        githubCreatedAt: new Date('2025-01-01T00:00:00.000Z'),
        githubUpdatedAt: new Date('2025-12-30T00:00:00.000Z'),
        lastSyncedAt: expect.any(Date) as Date,
      });
    });
  });

  describe('buildGithubReposCacheKey', () => {
    it('namespaces the cache key per user', () => {
      expect(buildGithubReposCacheKey('user-a')).toBe('user:user-a:github-repos');
      expect(buildGithubReposCacheKey('user-b')).toBe('user:user-b:github-repos');
    });
  });
});
