import { dash } from '@better-auth/infra';
import { redisStorage } from '@better-auth/redis-storage';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';
import { AUTH_REFERENCE_CSP_NONCE } from '..';

import type { CreateAuthOptions } from '../interfaces/create-auth-options.interface';

export function createAuth(options: CreateAuthOptions) {
  const {
    prisma,
    redisClient,
    secret,
    baseUrl,
    apiKey,
    githubClientId,
    githubClientSecret,
    trustedOrigins,
    sendVerificationEmail,
    sendExistingAccountNotice,
    verificationTokenTtlMs,
    enableDocs,
  } = options;

  const DEFAULT_PLUGINS = [dash({ apiKey })];

  return betterAuth({
    secret,
    baseURL: baseUrl,
    trustedOrigins,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secondaryStorage: redisClient ? redisStorage({ client: redisClient }) : undefined,
    plugins: enableDocs ? [openAPI({ nonce: AUTH_REFERENCE_CSP_NONCE }), ...DEFAULT_PLUGINS] : [...DEFAULT_PLUGINS],
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
