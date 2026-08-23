import type { GithubRepoApiResponse } from '../types/github-api.types';
import { GithubRepoSummaryResponse } from '../dto/github-repo-summary.response';

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

describe('GithubRepoSummaryResponse.fromApiResponse', () => {
  it('maps the raw GitHub API repo into the summary shape', () => {
    const result = GithubRepoSummaryResponse.fromApiResponse(buildRepo());

    expect(result).toEqual({
      githubId: '123',
      name: 'my-project',
      fullName: 'mariokreitz/my-project',
      htmlUrl: 'https://github.com/mariokreitz/my-project',
      description: 'A project description',
      homepage: 'https://myproject.dev',
      language: 'TypeScript',
      topics: ['cli'],
      private: false,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
