import { SKIP_RESPONSE_ENVELOPE_KEY } from '@app/common/constants/response.constants';
import { CreatedWebsiteTokenResponse } from '@app/modules/website-token/dto/created-website-token.response';
import { WebsiteTokenSummaryResponse } from '@app/modules/website-token/dto/website-token-summary.response';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import type { CreateWebsiteTokenDto } from '../dto/create-website-token.dto';
import { WebsiteTokenController } from '../website-token.controller';
import type { WebsiteTokenService } from '../website-token.service';

interface MockedWebsiteTokenService {
  getAllForUser: jest.Mock;
  getByIdForUser: jest.Mock;
  create: jest.Mock;
  delete: jest.Mock;
}

function buildSession(userId = 'user-a'): UserSession {
  return { user: { id: userId } } as unknown as UserSession;
}

function buildController(): {
  controller: WebsiteTokenController;
  websiteTokenService: MockedWebsiteTokenService;
} {
  const websiteTokenService: MockedWebsiteTokenService = {
    getAllForUser: jest.fn(),
    getByIdForUser: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const controller = new WebsiteTokenController(websiteTokenService as unknown as WebsiteTokenService);

  return { controller, websiteTokenService };
}

function buildTokenSummary(overrides: Partial<WebsiteTokenSummaryResponse> = {}): WebsiteTokenSummaryResponse {
  const response = new WebsiteTokenSummaryResponse();

  response.id = 'token-a';
  response.websiteId = 'website-a';
  response.name = 'Production Token';
  response.prefix = 'wst_live_aaaaaaaa';
  response.expiresAt = null;
  response.lastUsedAt = null;
  response.createdAt = new Date('2026-01-01T00:00:00.000Z');
  response.updatedAt = new Date('2026-01-01T00:00:00.000Z');

  return Object.assign(response, overrides);
}

function buildCreatedToken(overrides: Partial<CreatedWebsiteTokenResponse> = {}): CreatedWebsiteTokenResponse {
  const response = new CreatedWebsiteTokenResponse();

  response.id = 'token-a';
  response.name = 'Production Token';
  response.prefix = 'wst_live_aaaaaaaa';
  response.token = 'wst_live_aaaaaaaaQqZ1k7htN2eF9pR4sV6wY8xB0cD2gH4jL6mN8pQ';
  response.expiresAt = null;
  response.createdAt = new Date('2026-01-01T00:00:00.000Z');

  return Object.assign(response, overrides);
}

describe('WebsiteTokenController', () => {
  describe('getAll', () => {
    it('delegates to the service with the websiteId param and the session user id', async () => {
      const { controller, websiteTokenService } = buildController();
      const summaries = [buildTokenSummary()];
      websiteTokenService.getAllForUser.mockResolvedValue(summaries);

      const result = await controller.getAll('website-a', buildSession('user-a'));

      expect(websiteTokenService.getAllForUser).toHaveBeenCalledWith('website-a', 'user-a');
      expect(result).toBe(summaries);
    });
  });

  describe('getById', () => {
    it('delegates to the service with websiteId, tokenId and the session user id', async () => {
      const { controller, websiteTokenService } = buildController();
      const summary = buildTokenSummary();
      websiteTokenService.getByIdForUser.mockResolvedValue(summary);

      const result = await controller.getById('website-a', 'token-a', buildSession('user-a'));

      expect(websiteTokenService.getByIdForUser).toHaveBeenCalledWith('website-a', 'token-a', 'user-a');
      expect(result).toBe(summary);
    });
  });

  describe('create', () => {
    it('delegates to the service with the dto fields and the session user id', async () => {
      const { controller, websiteTokenService } = buildController();
      const created = buildCreatedToken();
      websiteTokenService.create.mockResolvedValue(created);

      const dto: CreateWebsiteTokenDto = { name: 'Production Token', expiresAt: '2027-08-23T00:00:00.000Z' };

      const result = await controller.create('website-a', dto, buildSession('user-a'));

      expect(websiteTokenService.create).toHaveBeenCalledWith(
        'website-a',
        'user-a',
        'Production Token',
        '2027-08-23T00:00:00.000Z',
      );
      expect(result).toBe(created);
    });

    it('passes an undefined expiresAt through unchanged when the dto omits it', async () => {
      const { controller, websiteTokenService } = buildController();
      websiteTokenService.create.mockResolvedValue(buildCreatedToken());

      const dto: CreateWebsiteTokenDto = { name: 'Production Token' };

      await controller.create('website-a', dto, buildSession('user-a'));

      expect(websiteTokenService.create).toHaveBeenCalledWith('website-a', 'user-a', 'Production Token', undefined);
    });
  });

  describe('delete', () => {
    it('delegates to the service with websiteId, tokenId and the session user id', async () => {
      const { controller, websiteTokenService } = buildController();
      websiteTokenService.delete.mockResolvedValue(undefined);

      await controller.delete('website-a', 'token-a', buildSession('user-a'));

      expect(websiteTokenService.delete).toHaveBeenCalledWith('website-a', 'token-a', 'user-a');
    });

    it('sets the 204 HTTP status code via handler metadata', () => {
      const deleteHandler = Reflect.get(WebsiteTokenController.prototype, 'delete');
      const httpCode: unknown = Reflect.getMetadata(HTTP_CODE_METADATA, deleteHandler);

      expect(httpCode).toBe(204);
    });

    it('skips the response envelope, since it returns no body', () => {
      const deleteHandler = Reflect.get(WebsiteTokenController.prototype, 'delete');
      const skipsEnvelope: unknown = Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE_KEY, deleteHandler);

      expect(skipsEnvelope).toBe(true);
    });
  });
});
