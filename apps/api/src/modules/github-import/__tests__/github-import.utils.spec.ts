import type { GithubRepoApiResponse } from '../types/github-api.types';
import { toCreateProjectData } from '../utils/github-import.utils';

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
  });
});
