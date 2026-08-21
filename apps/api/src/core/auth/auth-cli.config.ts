import { authConfig, databaseConfig, githubConfig, securityConfig, verificationConfig } from '@app/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../generated/prisma/client';
import { createAuth } from './strategies/auth.factory';

const database = databaseConfig();
const authCfg = authConfig();
const github = githubConfig();
const security = securityConfig();
const verification = verificationConfig();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.url }) });

export const auth = createAuth({
  prisma,
  apiKey: authCfg.apiKey,
  secret: authCfg.secret,
  baseUrl: authCfg.baseUrl,
  githubClientId: github.clientId,
  githubClientSecret: github.clientSecret,
  trustedOrigins: security.corsOrigins,

  sendVerificationEmail: async () => undefined,

  sendExistingAccountNotice: async () => undefined,
  verificationTokenTtlMs: verification.tokenTtlMs,
  enableDocs: security.enableSwagger,
});
