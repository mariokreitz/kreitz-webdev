import {
  arcjetConfig,
  authConfig,
  databaseConfig,
  githubConfig,
  resetConfig,
  securityConfig,
  verificationConfig,
} from '@app/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PinoLogger } from 'nestjs-pino';

import { PrismaClient } from '../../../generated/prisma/client';
import { createAuth } from './strategies/auth.factory';

const database = databaseConfig();
const authCfg = authConfig();
const github = githubConfig();
const security = securityConfig();
const verification = verificationConfig();
const arcjet = arcjetConfig();
const reset = resetConfig();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.url }) });

const logger = new PinoLogger({});
logger.setContext('AuthFactory');

export const auth = createAuth({
  prisma,
  logger,
  apiKey: authCfg.apiKey,
  secret: authCfg.secret,
  baseUrl: authCfg.baseUrl,
  githubClientId: github.clientId,
  githubClientSecret: github.clientSecret,
  trustedOrigins: security.corsOrigins,
  trustedProxies: arcjet.trustedProxies,
  errorUrl: `${reset.baseUrl}/auth/error`,

  sendVerificationEmail: async () => {
    await Promise.resolve();
  },

  sendExistingAccountNotice: async () => {
    await Promise.resolve();
  },
  verificationTokenTtlMs: verification.tokenTtlMs,
  enableDocs: security.enableSwagger,
});
