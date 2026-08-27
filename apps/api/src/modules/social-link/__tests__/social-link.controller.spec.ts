import type { CreateSocialLinkData, UpdateSocialLinkData } from '@app/database/types/social-link.types';
import type { SocialLinkDto } from '@app/modules/social-link/dto/social-link.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import type { CreateSocialLinkDto } from '../dto/create-social-link.dto';
import type { UpdateSocialLinkDto } from '../dto/update-social-link.dto';
import { SocialLinkController } from '../social-link.controller';
import type { SocialLinkService } from '../social-link.service';

interface MockedSocialLinkService {
  getAllForUser: jest.Mock;
  getByIdForUser: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

function buildSession(userId = 'user-a'): UserSession {
  return { user: { id: userId } } as unknown as UserSession;
}

function buildController(): {
  controller: SocialLinkController;
  socialLinkService: MockedSocialLinkService;
} {
  const socialLinkService: MockedSocialLinkService = {
    getAllForUser: jest.fn(),
    getByIdForUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const controller = new SocialLinkController(socialLinkService as unknown as SocialLinkService);

  return { controller, socialLinkService };
}

function buildSocialLinkDto(overrides: Partial<SocialLinkDto> = {}): SocialLinkDto {
  return {
    id: 'social-link-a',
    websiteId: 'website-a',
    platform: 'github',
    label: 'GitHub',
    url: 'https://github.com/mariokreitz',
    sortOrder: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('SocialLinkController', () => {
  describe('getAll', () => {
    it('delegates to the service with the websiteId param and the session user id, then maps records to dtos', async () => {
      const { controller, socialLinkService } = buildController();
      const socialLink = buildSocialLinkDto();
      socialLinkService.getAllForUser.mockResolvedValue([socialLink]);

      const result = await controller.getAll('website-a', buildSession('user-a'));

      expect(socialLinkService.getAllForUser).toHaveBeenCalledWith('website-a', 'user-a');
      expect(result).toEqual([socialLink]);
    });
  });

  describe('getById', () => {
    it('delegates to the service with websiteId, id, and the session user id', async () => {
      const { controller, socialLinkService } = buildController();
      const socialLink = buildSocialLinkDto();
      socialLinkService.getByIdForUser.mockResolvedValue(socialLink);

      const result = await controller.getById('website-a', 'social-link-a', buildSession('user-a'));

      expect(socialLinkService.getByIdForUser).toHaveBeenCalledWith('website-a', 'social-link-a', 'user-a');
      expect(result).toEqual(socialLink);
    });
  });

  describe('create', () => {
    it('delegates to the service with the mapped create data and the session user id', async () => {
      const { controller, socialLinkService } = buildController();
      const socialLink = buildSocialLinkDto();
      socialLinkService.create.mockResolvedValue(socialLink);

      const dto: CreateSocialLinkDto = {
        platform: 'github',
        url: 'https://github.com/mariokreitz',
      } as CreateSocialLinkDto;
      dto.toCreateSocialLinkData = (websiteId: string): CreateSocialLinkData => ({
        websiteId,
        platform: 'github',
        url: 'https://github.com/mariokreitz',
      });

      const result = await controller.create('website-a', dto, buildSession('user-a'));

      expect(socialLinkService.create).toHaveBeenCalledWith('website-a', 'user-a', {
        websiteId: 'website-a',
        platform: 'github',
        url: 'https://github.com/mariokreitz',
      });
      expect(result).toEqual(socialLink);
    });
  });

  describe('update', () => {
    it('delegates to the service with websiteId, id, the session user id, and the mapped update data', async () => {
      const { controller, socialLinkService } = buildController();
      const socialLink = buildSocialLinkDto({ label: 'New Label' });
      socialLinkService.update.mockResolvedValue(socialLink);

      const dto: UpdateSocialLinkDto = {} as UpdateSocialLinkDto;
      dto.toUpdateSocialLinkData = (): UpdateSocialLinkData => ({ label: 'New Label' });

      const result = await controller.update('website-a', 'social-link-a', dto, buildSession('user-a'));

      expect(socialLinkService.update).toHaveBeenCalledWith('website-a', 'social-link-a', 'user-a', {
        label: 'New Label',
      });
      expect(result).toEqual(socialLink);
    });
  });

  describe('delete', () => {
    it('delegates to the service with websiteId, id, and the session user id', async () => {
      const { controller, socialLinkService } = buildController();
      socialLinkService.delete.mockResolvedValue(undefined);

      await controller.delete('website-a', 'social-link-a', buildSession('user-a'));

      expect(socialLinkService.delete).toHaveBeenCalledWith('website-a', 'social-link-a', 'user-a');
    });
  });
});
