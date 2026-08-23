import {
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { GithubApiService } from '../github-api.service';

function buildResponse(overrides: Partial<Response> & { jsonBody?: unknown } = {}): Response {
  const { jsonBody, ...rest } = overrides;

  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: jest.fn().mockResolvedValue(jsonBody ?? {}),
    ...rest,
  } as unknown as Response;
}

function buildRepo(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 1,
    name: 'repo-a',
    full_name: 'owner-a/repo-a',
    html_url: 'https://github.com/owner-a/repo-a',
    description: null,
    homepage: null,
    language: null,
    topics: [],
    private: false,
    updated_at: '2026-08-20T09:15:00.000Z',
    owner: { id: 1, login: 'owner-a' },
    ...overrides,
  };
}

describe('GithubApiService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listUserRepos', () => {
    it('returns the parsed repo list on success', async () => {
      const service = new GithubApiService();
      const repos = [buildRepo()];

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ jsonBody: repos }));

      const result = await service.listUserRepos('token-a');

      expect(result).toEqual(repos);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.github.com/user/repos?visibility=all'),
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: 'Bearer token-a',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );
    });

    it('throws ServiceUnavailableException when the underlying fetch rejects', async () => {
      const service = new GithubApiService();

      jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

      await expect(service.listUserRepos('token-a')).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('throws a 502 HttpException when the response body cannot be parsed as JSON', async () => {
      const service = new GithubApiService();

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(buildResponse({ json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')) }));

      const promise = service.listUserRepos('token-a');

      await expect(promise).rejects.toBeInstanceOf(HttpException);
      await expect(promise).rejects.toMatchObject({ status: HttpStatus.BAD_GATEWAY });
    });
  });

  describe('getRepo', () => {
    it('returns the parsed repo on success', async () => {
      const service = new GithubApiService();
      const repo = buildRepo();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ jsonBody: repo }));

      const result = await service.getRepo('token-a', 'owner-a', 'repo-a');

      expect(result).toEqual(repo);
      expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/repos/owner-a/repo-a', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer token-a',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
    });

    it('throws UnauthorizedException on a 401 response', async () => {
      const service = new GithubApiService();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ ok: false, status: 401 }));

      await expect(service.getRepo('token-a', 'owner-a', 'repo-a')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws NotFoundException on a 404 response', async () => {
      const service = new GithubApiService();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ ok: false, status: 404 }));

      await expect(service.getRepo('token-a', 'owner-a', 'repo-a')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws a 429 HttpException when a 403 response carries a zeroed rate-limit header', async () => {
      const service = new GithubApiService();
      const headers = new Headers({ 'x-ratelimit-remaining': '0' });

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ ok: false, status: 403, headers }));

      const promise = service.getRepo('token-a', 'owner-a', 'repo-a');

      await expect(promise).rejects.toBeInstanceOf(HttpException);
      await expect(promise).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    });

    it('throws a 429 HttpException on a 429 response with a zeroed rate-limit header', async () => {
      const service = new GithubApiService();
      const headers = new Headers({ 'x-ratelimit-remaining': '0' });

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ ok: false, status: 429, headers }));

      const promise = service.getRepo('token-a', 'owner-a', 'repo-a');

      await expect(promise).rejects.toBeInstanceOf(HttpException);
      await expect(promise).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    });

    it('throws a generic 502 HttpException for a plain 403 without a zeroed rate-limit header', async () => {
      const service = new GithubApiService();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ ok: false, status: 403, headers: new Headers() }));

      const promise = service.getRepo('token-a', 'owner-a', 'repo-a');

      await expect(promise).rejects.toBeInstanceOf(HttpException);
      await expect(promise).rejects.toMatchObject({ status: HttpStatus.BAD_GATEWAY });
    });

    it('throws ServiceUnavailableException when the underlying fetch rejects', async () => {
      const service = new GithubApiService();

      jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

      await expect(service.getRepo('token-a', 'owner-a', 'repo-a')).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('throws a 502 HttpException when the response body cannot be parsed as JSON', async () => {
      const service = new GithubApiService();

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(buildResponse({ json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')) }));

      const promise = service.getRepo('token-a', 'owner-a', 'repo-a');

      await expect(promise).rejects.toBeInstanceOf(HttpException);
      await expect(promise).rejects.toMatchObject({ status: HttpStatus.BAD_GATEWAY });
    });
  });
});
