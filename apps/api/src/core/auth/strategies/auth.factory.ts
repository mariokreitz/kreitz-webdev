import { redisStorage } from '@better-auth/redis-storage';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';

import { AUTH_REFERENCE_CSP_NONCE } from '../constants/auth-reference.constants';
import type { CreateAuthOptions } from '../interfaces/create-auth-options.interface';

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
    sendExistingAccountNotice,
    verificationTokenTtlMs,
    enableDocs,
  } = options;

  return betterAuth({
    secret,
    baseURL: baseUrl,
    trustedOrigins,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secondaryStorage: redisClient ? redisStorage({ client: redisClient }) : undefined,
    plugins: enableDocs ? [openAPI({ nonce: AUTH_REFERENCE_CSP_NONCE })] : [],
    socialProviders: {
      github: {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      onExistingUserSignUp: async ({ user }) => sendExistingAccountNotice({ to: user.email }),
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => sendVerificationEmail({ to: user.email, url, token }),
      expiresIn: Math.floor(verificationTokenTtlMs / 1000), // ms -> seconds, better-auth wants seconds
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
    },
  });
}
