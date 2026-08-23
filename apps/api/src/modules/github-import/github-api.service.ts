import { GithubRepoApiResponse } from '@app/modules/github-import/types/github-api.types';
import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

@Injectable()
export class GithubApiService {
  public async listUserRepos(accessToken: string): Promise<GithubRepoApiResponse[]> {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/user/repos?visibility=all&affiliation=owner&sort=updated&per_page=100`,
      { headers: this.buildHeaders(accessToken) },
    );

    this.assertOk(response);

    return (await response.json()) as GithubRepoApiResponse[];
  }

  public async getRepo(accessToken: string, owner: string, repo: string): Promise<GithubRepoApiResponse> {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      { headers: this.buildHeaders(accessToken) },
    );

    this.assertOk(response);

    return (await response.json()) as GithubRepoApiResponse;
  }

  private buildHeaders(accessToken: string): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    };
  }

  private assertOk(response: Response): void {
    if (response.ok) {
      return;
    }

    const status = response.status;

    if (
      (status === HTTP_STATUS_FORBIDDEN || status === HTTP_STATUS_TOO_MANY_REQUESTS) &&
      response.headers.get('x-ratelimit-remaining') === '0'
    ) {
      throw new HttpException('GitHub API rate limit exceeded, try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (status === HTTP_STATUS_UNAUTHORIZED) {
      throw new UnauthorizedException(
        'The stored GitHub access token is invalid or revoked. Please re-link your GitHub account.',
      );
    }

    if (status === HTTP_STATUS_NOT_FOUND) {
      throw new NotFoundException('GitHub repository not found or not accessible with the current access token');
    }

    throw new HttpException('GitHub API request failed', HttpStatus.BAD_GATEWAY);
  }
}
