import { dash } from '@better-auth/infra';
import { redisStorage } from '@better-auth/redis-storage';
import { type Auth, betterAuth, type BetterAuthOptions } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';
import { AUTH_REFERENCE_CSP_NONCE } from '..';

import type { CreateAuthOptions } from '../interfaces/create-auth-options.interface';

const APP_NAME = 'Kreitz WebDev';

export function createAuth(options: CreateAuthOptions): Auth {
  const {
    prisma,
    redisClient,
    secret,
    baseUrl,
    apiKey,
    githubClientId,
    githubClientSecret,
    trustedOrigins,
    trustedProxies,
    errorUrl,
    sendVerificationEmail,
    sendExistingAccountNotice,
    verificationTokenTtlMs,
    enableDocs,
  } = options;

  const DEFAULT_PLUGINS = [dash({ apiKey })];

  const betterAuthOptions: BetterAuthOptions = {
    appName: APP_NAME,
    secret,
    baseURL: baseUrl,
    trustedOrigins,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secondaryStorage: redisClient ? redisStorage({ client: redisClient }) : undefined,
    session: {
      storeSessionInDatabase: true,
    },
    rateLimit: redisClient ? { storage: 'secondary-storage' } : undefined,
    plugins: enableDocs ? [openAPI({ nonce: AUTH_REFERENCE_CSP_NONCE }), ...DEFAULT_PLUGINS] : [...DEFAULT_PLUGINS],
    socialProviders: {
      github: {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
        // `scope` is additive to GitHub's default ["read:user","user:email"], not a replacement — login is unaffected.
        scope: ['repo'],
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      onExistingUserSignUp: async ({ user }) => {
        await sendExistingAccountNotice({ to: user.email });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => {
        await sendVerificationEmail({ to: user.email, url, token });
      },
      expiresIn: Math.floor(verificationTokenTtlMs / 1000), // ms -> seconds, better-auth wants seconds
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
    },
    advanced: {
      ipAddress: trustedProxies.length > 0 ? { trustedProxies } : undefined,
      database: { joins: true },
    },
    onAPIError: {
      errorURL: errorUrl,
    },
  };

  return betterAuth(betterAuthOptions);
}
