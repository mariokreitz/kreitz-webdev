import type { Redis } from 'ioredis';

import type { PrismaClient } from '../../../../generated/prisma/client';

export interface CreateAuthOptions {
  readonly prisma: PrismaClient;
  readonly redisClient?: Redis;
  readonly secret: string;
  readonly baseUrl: string;
  readonly githubClientId: string;
  readonly githubClientSecret: string;
  readonly trustedOrigins: string[];
  readonly sendVerificationEmail: (input: { to: string; url: string; token: string }) => Promise<void>;
  readonly sendExistingAccountNotice: (input: { to: string }) => Promise<void>;
  readonly verificationTokenTtlMs: number;
  readonly enableDocs: boolean;
}
