import { z } from 'zod';

import { appSchema } from './app.schema';
import { authSchema } from './auth.schema';
import { databaseSchema } from './database.schema';
import { githubSchema } from './github.schema';
import { healthSchema } from './health.schema';
import { redisSchema } from './redis.schema';
import { resetSchema } from './reset.schema';
import { securitySchema } from './security.schema';
import { throttleSchema } from './throttle.schema';
import { verificationSchema } from './verification.schema';

export * from './app.schema';
export * from './auth.schema';
export * from './database.schema';
export * from './github.schema';
export * from './health.schema';
export * from './redis.schema';
export * from './reset.schema';
export * from './security.schema';
export * from './throttle.schema';
export * from './verification.schema';

export const envSchema = z.object({
  ...appSchema.shape,
  ...databaseSchema.shape,
  ...authSchema.shape,
  ...redisSchema.shape,
  ...throttleSchema.shape,
  ...healthSchema.shape,
  ...securitySchema.shape,
  ...resetSchema.shape,
  ...verificationSchema.shape,
  ...githubSchema.shape,
});

export type Env = z.infer<typeof envSchema>;
