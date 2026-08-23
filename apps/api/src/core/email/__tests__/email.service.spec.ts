import type { EmailConfig } from '@app/config/email.config';
import type { PinoLogger } from 'nestjs-pino';
import { Resend } from 'resend';

import { EmailService } from '../email.service';

jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

interface MockResendInstance {
  emails: {
    send: jest.Mock;
  };
}

const mockResendInstance: MockResendInstance = {
  emails: {
    send: jest.fn(),
  },
};

const mockResendCtor = jest.mocked(Resend);

interface MockedLogger {
  setContext: jest.Mock;
  info: jest.Mock;
  debug: jest.Mock;
  error: jest.Mock;
}

function buildLogger(): MockedLogger {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };
}

function buildConfig(overrides: Partial<EmailConfig> = {}): EmailConfig {
  return {
    resendApiKey: 'resend-api-key',
    fromAddress: 'noreply@example.com',
    ...overrides,
  };
}

function buildService(configOverrides: Partial<EmailConfig> = {}): {
  service: EmailService;
  logger: MockedLogger;
} {
  const logger = buildLogger();
  const service = new EmailService(buildConfig(configOverrides), logger as unknown as PinoLogger);

  return { service, logger };
}

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResendCtor.mockImplementation(() => mockResendInstance as unknown as Resend);
  });

  describe('when RESEND_API_KEY is not set', () => {
    it('logs instead of constructing a Resend client', () => {
      buildService({ resendApiKey: '' });

      expect(mockResendCtor).not.toHaveBeenCalled();
    });

    it('skips sending and logs a debug noop event instead', async () => {
      const { service, logger } = buildService({ resendApiKey: '' });

      await service.sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' });

      expect(mockResendInstance.emails.send).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendMail success path', () => {
    it('constructs the Resend client with the configured api key', () => {
      buildService({ resendApiKey: 'my-key' });

      expect(mockResendCtor).toHaveBeenCalledWith('my-key');
    });

    it('sends the email via resend.emails.send with the configured from address', async () => {
      const { service } = buildService();
      mockResendInstance.emails.send.mockResolvedValue({ error: null });

      await service.sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: ['user@example.com'],
        subject: 'Hello',
        html: '<p>Hi</p>',
      });
    });

    it('resolves without logging an error when the send succeeds', async () => {
      const { service, logger } = buildService();
      mockResendInstance.emails.send.mockResolvedValue({ error: null });

      await expect(
        service.sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' }),
      ).resolves.toBeUndefined();
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('sendMail failure paths', () => {
    it('logs an error and resolves when resend returns an error payload', async () => {
      const { service, logger } = buildService();
      mockResendInstance.emails.send.mockResolvedValue({ error: { message: 'invalid recipient' } });

      await expect(
        service.sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' }),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('logs an error and resolves without throwing when resend.emails.send rejects', async () => {
      const { service, logger } = buildService();
      const thrown = new Error('network down');
      mockResendInstance.emails.send.mockRejectedValue(thrown);

      await expect(
        service.sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' }),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith({
        event: 'email.send_failed',
        to: 'user@example.com',
        error: 'network down',
      });
    });

    it('logs an error without the original error object when a non-Error value is thrown', async () => {
      const { service, logger } = buildService();
      mockResendInstance.emails.send.mockRejectedValue('not an error instance');

      await expect(
        service.sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' }),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith({
        event: 'email.send_failed',
        to: 'user@example.com',
        error: 'not an error instance',
      });
    });
  });

  describe('sendVerificationEmail', () => {
    it('delegates to sendMail with a verification subject and a link containing the given url', async () => {
      const { service } = buildService();
      mockResendInstance.emails.send.mockResolvedValue({ error: null });

      await service.sendVerificationEmail({ to: 'user@example.com', url: 'https://example.com/verify?token=abc' });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user@example.com'],
          subject: 'Verify your email address',
          html: expect.stringContaining('https://example.com/verify?token=abc') as string,
        }),
      );
    });
  });

  describe('sendExistingAccountNotice', () => {
    it('delegates to sendMail with the existing-account-notice subject', async () => {
      const { service } = buildService();
      mockResendInstance.emails.send.mockResolvedValue({ error: null });

      await service.sendExistingAccountNotice({ to: 'user@example.com' });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user@example.com'],
          subject: 'Someone tried to sign up with your email',
        }),
      );
    });
  });
});
