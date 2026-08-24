import type { PinoLogger } from 'nestjs-pino';
import { trackUserLogin } from '../track-user-login';

import type { PrismaClient } from '../../../../../generated/prisma/client';

interface MockedLogger {
  error: jest.Mock;
}

function buildLogger(): MockedLogger {
  return {
    error: jest.fn(),
  };
}

describe('trackUserLogin', () => {
  it('copies the pre-update lastLoginAt into previousLoginAt and sets lastLoginAt to a driver-bound Date in a single UPDATE', async () => {
    const executeRaw = jest.fn().mockResolvedValue(1);
    const prisma = { $executeRaw: executeRaw } as unknown as PrismaClient;
    const logger = buildLogger();

    await trackUserLogin(prisma, 'user-1', logger as unknown as PinoLogger);

    expect(executeRaw).toHaveBeenCalledTimes(1);
    const [strings, lastLoginAt, userId] = executeRaw.mock.calls[0] as [TemplateStringsArray, Date, string];
    const sql = strings.join('?');

    expect(sql).toContain('"previousLoginAt" = "lastLoginAt"');
    expect(sql).toContain('"lastLoginAt" = ?');
    expect(sql.trim().endsWith('WHERE "id" = ?')).toBe(true);
    expect(lastLoginAt).toBeInstanceOf(Date);
    expect(userId).toBe('user-1');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does not propagate an error from the write, since login must not fail on a tracking blip, and logs it instead', async () => {
    const executeRaw = jest.fn().mockRejectedValue(new Error('connection reset'));
    const prisma = { $executeRaw: executeRaw } as unknown as PrismaClient;
    const logger = buildLogger();

    await expect(trackUserLogin(prisma, 'user-1', logger as unknown as PinoLogger)).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith({
      event: 'auth.track_user_login.failed_open',
      userId: 'user-1',
      reason: 'connection reset',
    });
  });
});
