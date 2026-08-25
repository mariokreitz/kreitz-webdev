import type { WebsiteDomainVerificationResponse } from '@app/modules/website-domain/dto/website-domain-verification.response';
import type { WebsiteDomainDto } from '@app/modules/website-domain/dto/website-domain.dto';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import type { CreateWebsiteDomainDto } from '../dto/create-website-domain.dto';
import type { UpdateWebsiteDomainDto } from '../dto/update-website-domain.dto';
import { WebsiteDomainController } from '../website-domain.controller';
import type { WebsiteDomainService } from '../website-domain.service';

interface MockedWebsiteDomainService {
  getAllForUser: jest.Mock;
  getByIdForUser: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  verify: jest.Mock;
}

function buildSession(userId = 'user-a'): UserSession {
  return { user: { id: userId } } as unknown as UserSession;
}

function buildController(): {
  controller: WebsiteDomainController;
  websiteDomainService: MockedWebsiteDomainService;
} {
  const websiteDomainService: MockedWebsiteDomainService = {
    getAllForUser: jest.fn(),
    getByIdForUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    verify: jest.fn(),
  };

  const controller = new WebsiteDomainController(websiteDomainService as unknown as WebsiteDomainService);

  return { controller, websiteDomainService };
}

function buildDomainDto(overrides: Partial<WebsiteDomainDto> = {}): WebsiteDomainDto {
  return {
    id: 'domain-a',
    websiteId: 'website-a',
    domain: 'mario.dev',
    verified: false,
    verifiedAt: null,
    verificationToken: 'verification-token-a',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function buildVerificationResponse(
  overrides: Partial<WebsiteDomainVerificationResponse> = {},
): WebsiteDomainVerificationResponse {
  return {
    id: 'domain-a',
    websiteId: 'website-a',
    domain: 'mario.dev',
    verified: true,
    verifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    failureReason: null,
    ...overrides,
  };
}

describe('WebsiteDomainController', () => {
  describe('getAll', () => {
    it('delegates to the service with the websiteId param and the session user id, then maps records to dtos', async () => {
      const { controller, websiteDomainService } = buildController();
      const domainRecord = buildDomainDto();
      websiteDomainService.getAllForUser.mockResolvedValue([domainRecord]);

      const result = await controller.getAll('website-a', buildSession('user-a'));

      expect(websiteDomainService.getAllForUser).toHaveBeenCalledWith('website-a', 'user-a');
      expect(result).toEqual([domainRecord]);
    });
  });

  describe('getById', () => {
    it('delegates to the service with websiteId, domainId and the session user id', async () => {
      const { controller, websiteDomainService } = buildController();
      const domainRecord = buildDomainDto();
      websiteDomainService.getByIdForUser.mockResolvedValue(domainRecord);

      const result = await controller.getById('website-a', 'domain-a', buildSession('user-a'));

      expect(websiteDomainService.getByIdForUser).toHaveBeenCalledWith('website-a', 'domain-a', 'user-a');
      expect(result).toEqual(domainRecord);
    });
  });

  describe('create', () => {
    it('delegates to the service with the dto domain and the session user id', async () => {
      const { controller, websiteDomainService } = buildController();
      const domainRecord = buildDomainDto();
      websiteDomainService.create.mockResolvedValue(domainRecord);

      const dto: CreateWebsiteDomainDto = { domain: 'mario.dev' };

      const result = await controller.create('website-a', dto, buildSession('user-a'));

      expect(websiteDomainService.create).toHaveBeenCalledWith('website-a', 'user-a', 'mario.dev');
      expect(result).toEqual(domainRecord);
    });
  });

  describe('update', () => {
    it('delegates to the service with websiteId, domainId, the session user id and the dto domain', async () => {
      const { controller, websiteDomainService } = buildController();
      const domainRecord = buildDomainDto({ domain: 'new-domain.dev' });
      websiteDomainService.update.mockResolvedValue(domainRecord);

      const dto: UpdateWebsiteDomainDto = { domain: 'new-domain.dev' };

      const result = await controller.update('website-a', 'domain-a', dto, buildSession('user-a'));

      expect(websiteDomainService.update).toHaveBeenCalledWith('website-a', 'domain-a', 'user-a', 'new-domain.dev');
      expect(result).toEqual(domainRecord);
    });

    it('passes an undefined domain through unchanged when the dto omits it', async () => {
      const { controller, websiteDomainService } = buildController();
      websiteDomainService.update.mockResolvedValue(buildDomainDto());

      const dto: UpdateWebsiteDomainDto = {};

      await controller.update('website-a', 'domain-a', dto, buildSession('user-a'));

      expect(websiteDomainService.update).toHaveBeenCalledWith('website-a', 'domain-a', 'user-a', undefined);
    });
  });

  describe('delete', () => {
    it('delegates to the service with websiteId, domainId and the session user id', async () => {
      const { controller, websiteDomainService } = buildController();
      websiteDomainService.delete.mockResolvedValue(undefined);

      await controller.delete('website-a', 'domain-a', buildSession('user-a'));

      expect(websiteDomainService.delete).toHaveBeenCalledWith('website-a', 'domain-a', 'user-a');
    });
  });

  describe('verify', () => {
    it('delegates to the service with websiteId, domainId and the session user id and returns its result directly', async () => {
      const { controller, websiteDomainService } = buildController();
      const verificationResponse = buildVerificationResponse();
      websiteDomainService.verify.mockResolvedValue(verificationResponse);

      const result = await controller.verify('website-a', 'domain-a', buildSession('user-a'));

      expect(websiteDomainService.verify).toHaveBeenCalledWith('website-a', 'domain-a', 'user-a');
      expect(result).toBe(verificationResponse);
    });

    it('sets the 200 HTTP status code via handler metadata', () => {
      const verifyHandler = Reflect.get(WebsiteDomainController.prototype, 'verify');
      const httpCode: unknown = Reflect.getMetadata(HTTP_CODE_METADATA, verifyHandler);

      expect(httpCode).toBe(200);
    });
  });
});
