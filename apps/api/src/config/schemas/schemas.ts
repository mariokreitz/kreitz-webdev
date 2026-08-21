import { z } from 'zod';

import { appSchema } from './app.schema';
import { arcjetSchema } from './arcjet.schema';
import { authSchema } from './auth.schema';
import { databaseSchema } from './database.schema';
import { emailSchema } from './email.schema';
import { githubSchema } from './github.schema';
import { healthSchema } from './health.schema';
import { redisSchema } from './redis.schema';
import { resetSchema } from './reset.schema';
import { securitySchema } from './security.schema';
import { verificationSchema } from './verification.schema';

export * from './app.schema';
export * from './arcjet.schema';
export * from './auth.schema';
export * from './database.schema';
export * from './email.schema';
export * from './github.schema';
export * from './health.schema';
export * from './redis.schema';
export * from './reset.schema';
export * from './security.schema';
export * from './verification.schema';

export const envSchema = z
  .object({
    ...appSchema.shape,
    ...arcjetSchema.shape,
    ...databaseSchema.shape,
    ...authSchema.shape,
    ...redisSchema.shape,
    ...healthSchema.shape,
    ...securitySchema.shape,
    ...resetSchema.shape,
    ...verificationSchema.shape,
    ...githubSchema.shape,
    ...emailSchema.shape,
  })
  .refine((env) => !(env.NODE_ENV === 'production' && env.TRUST_PROXY && env.ARCJET_TRUSTED_PROXIES.length === 0), {
    message:
      'ARCJET_TRUSTED_PROXIES must be set when TRUST_PROXY is enabled in production — otherwise Arcjet and better-auth resolve client IPs from spoofable forwarded headers.',
    path: ['ARCJET_TRUSTED_PROXIES'],
  });

export type Env = z.infer<typeof envSchema>;
