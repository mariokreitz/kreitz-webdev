import { toErrorReason } from '@app/common/utils/arcjet.utils';
import type { PinoLogger } from 'nestjs-pino';

import type { PrismaClient } from '../../../../generated/prisma/client';

// Single UPDATE so `previousLoginAt` reads the pre-update `lastLoginAt` atomically (driver-bound Date, not SQL `now()`, to match every other Prisma-written timestamp); failures are swallowed since this hook is awaited by the sign-in flow and a tracking-write blip must not fail an otherwise-successful login.
export async function trackUserLogin(prisma: PrismaClient, userId: string, logger: PinoLogger): Promise<void> {
  try {
    await prisma.$executeRaw`UPDATE "user" SET "previousLoginAt" = "lastLoginAt", "lastLoginAt" = ${new Date()} WHERE "id" = ${userId}`;
  } catch (error) {
    logger.error({ event: 'auth.track_user_login.failed_open', userId, reason: toErrorReason(error) });
  }
}
