import { authConfig, databaseConfig, githubConfig, securityConfig, verificationConfig } from '@app/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../generated/prisma/client';
import { createAuth } from './auth.factory';

const database = databaseConfig();
const authCfg = authConfig();
const github = githubConfig();
const security = securityConfig();
const verification = verificationConfig();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.url }) });

export const auth = createAuth({
  prisma,
  secret: authCfg.secret,
  baseUrl: authCfg.baseUrl,
  githubClientId: github.clientId,
  githubClientSecret: github.clientSecret,
  trustedOrigins: security.corsOrigins,
  // eslint-disable-next-line @typescript-eslint/require-await -- no-op placeholder, only needs to satisfy the async Promise<void> signature for CLI schema generation.
  sendVerificationEmail: async () => undefined,
  verificationTokenTtlMs: verification.tokenTtlMs,
});
