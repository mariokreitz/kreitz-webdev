import { redisStorage } from '@better-auth/redis-storage';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { Redis } from 'ioredis';

import type { PrismaClient } from '../../../generated/prisma/client';

export interface CreateAuthOptions {
  readonly prisma: PrismaClient;
  readonly redisClient?: Redis;
  readonly secret: string;
  readonly baseUrl: string;
  readonly githubClientId: string;
  readonly githubClientSecret: string;
  readonly trustedOrigins: string[];
  readonly sendVerificationEmail: (input: { to: string; url: string; token: string }) => Promise<void>;
  readonly verificationTokenTtlMs: number;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types -- return type must stay inferred; betterAuth()'s return type is a generic conditional type keyed off the literal options object, so annotating it with ReturnType<typeof betterAuth> (or any manual type) widens it and breaks assignability (see `Auth<T>` context/adapter generics).
export function createAuth(options: CreateAuthOptions) {
  const {
    prisma,
    redisClient,
    secret,
    baseUrl,
    githubClientId,
    githubClientSecret,
    trustedOrigins,
    sendVerificationEmail,
    verificationTokenTtlMs,
  } = options;

  return betterAuth({
    secret,
    baseURL: baseUrl,
    trustedOrigins,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secondaryStorage: redisClient ? redisStorage({ client: redisClient }) : undefined,
    socialProviders: {
      github: {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => sendVerificationEmail({ to: user.email, url, token }),
      expiresIn: Math.floor(verificationTokenTtlMs / 1000), // ms -> seconds, better-auth wants seconds
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
