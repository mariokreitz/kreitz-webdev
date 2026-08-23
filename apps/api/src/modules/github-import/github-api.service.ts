import { GithubRepoApiResponse } from '@app/modules/github-import/types/github-api.types';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

@Injectable()
export class GithubApiService {
  public async listUserRepos(accessToken: string): Promise<GithubRepoApiResponse[]> {
    const response = await this.fetchGithub(
      `${GITHUB_API_BASE_URL}/user/repos?visibility=all&affiliation=owner&sort=updated&per_page=100`,
      accessToken,
    );

    this.assertOk(response);

    return this.parseJson<GithubRepoApiResponse[]>(response);
  }

  public async getRepo(accessToken: string, owner: string, repo: string): Promise<GithubRepoApiResponse> {
    const response = await this.fetchGithub(
      `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      accessToken,
    );

    this.assertOk(response);

    return this.parseJson<GithubRepoApiResponse>(response);
  }

  private async fetchGithub(url: string, accessToken: string): Promise<Response> {
    try {
      return await fetch(url, { headers: this.buildHeaders(accessToken) });
    } catch {
      throw new ServiceUnavailableException('GitHub API is unreachable, try again later');
    }
  }

  private async parseJson<T>(response: Response): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw new HttpException('GitHub API returned an unparseable response', HttpStatus.BAD_GATEWAY);
    }
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
