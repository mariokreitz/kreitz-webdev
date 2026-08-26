import type { EmailService } from '@app/core/email';
import type { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import type { UserRecord } from '@app/database/types/user.repository.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { PublicContactService } from '../public-contact.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildWebsite(overrides: Partial<WebsiteRecord> = {}): WebsiteRecord {
  return {
    id: 'website-a',
    userId: 'user-a',
    name: 'Website A',
    slug: 'website-a',
    enabled: true,
    contactEmail: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildUser(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'user-a',
    email: 'owner@example.com',
    ...overrides,
  };
}

interface MockedLogger {
  setContext: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
}

function buildLogger(): MockedLogger {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

interface MockedWebsiteRepository {
  findById: jest.Mock;
}

interface MockedUserRepository {
  findById: jest.Mock;
}

interface MockedEmailService {
  sendContactFormMessage: jest.Mock;
}

function buildService(): {
  service: PublicContactService;
  websiteRepository: MockedWebsiteRepository;
  userRepository: MockedUserRepository;
  emailService: MockedEmailService;
  logger: MockedLogger;
} {
  const websiteRepository: MockedWebsiteRepository = { findById: jest.fn() };
  const userRepository: MockedUserRepository = { findById: jest.fn() };
  const emailService: MockedEmailService = { sendContactFormMessage: jest.fn() };
  const logger = buildLogger();

  const service = new PublicContactService(
    websiteRepository as unknown as IWebsiteRepository,
    userRepository,
    emailService as unknown as EmailService,
    logger as unknown as PinoLogger,
  );

  return { service, websiteRepository, userRepository, emailService, logger };
}

const INPUT = { name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there' };

describe('PublicContactService', () => {
  describe('submit', () => {
    it('throws NotFoundException when the website does not exist', async () => {
      const { service, websiteRepository, emailService } = buildService();
      websiteRepository.findById.mockResolvedValue(null);

      await expect(service.submit('missing-website', INPUT)).rejects.toBeInstanceOf(NotFoundException);
      expect(emailService.sendContactFormMessage).not.toHaveBeenCalled();
    });

    it('sends to the website contactEmail without looking up the owning user when it is set', async () => {
      const { service, websiteRepository, userRepository, emailService } = buildService();
      websiteRepository.findById.mockResolvedValue(buildWebsite({ contactEmail: 'contact@example.com' }));
      emailService.sendContactFormMessage.mockResolvedValue(true);

      await service.submit('website-a', INPUT);

      expect(emailService.sendContactFormMessage).toHaveBeenCalledWith({
        to: 'contact@example.com',
        fromName: INPUT.name,
        fromEmail: INPUT.email,
        message: INPUT.message,
      });
      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('falls back to the owning user email when contactEmail is unset', async () => {
      const { service, websiteRepository, userRepository, emailService } = buildService();
      websiteRepository.findById.mockResolvedValue(buildWebsite({ contactEmail: null }));
      userRepository.findById.mockResolvedValue(buildUser({ email: 'owner@example.com' }));
      emailService.sendContactFormMessage.mockResolvedValue(true);

      await service.submit('website-a', INPUT);

      expect(userRepository.findById).toHaveBeenCalledWith('user-a');
      expect(emailService.sendContactFormMessage).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'owner@example.com' }),
      );
    });

    it('throws NotFoundException when the owning user cannot be found', async () => {
      const { service, websiteRepository, userRepository } = buildService();
      websiteRepository.findById.mockResolvedValue(buildWebsite({ contactEmail: null }));
      userRepository.findById.mockResolvedValue(null);

      await expect(service.submit('website-a', INPUT)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ServiceUnavailableException when the email fails to send, without a false success', async () => {
      const { service, websiteRepository, emailService } = buildService();
      websiteRepository.findById.mockResolvedValue(buildWebsite({ contactEmail: 'contact@example.com' }));
      emailService.sendContactFormMessage.mockResolvedValue(false);

      await expect(service.submit('website-a', INPUT)).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('resolves without throwing when the email send succeeds', async () => {
      const { service, websiteRepository, emailService } = buildService();
      websiteRepository.findById.mockResolvedValue(buildWebsite({ contactEmail: 'contact@example.com' }));
      emailService.sendContactFormMessage.mockResolvedValue(true);

      await expect(service.submit('website-a', INPUT)).resolves.toBeUndefined();
    });
  });
});
