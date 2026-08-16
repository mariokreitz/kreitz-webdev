import { z } from 'zod';

import { boolFromEnv } from './common.schema';

export const securitySchema = z.object({
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  CORS_CREDENTIALS: boolFromEnv,
  BODY_LIMIT: z.string().default('100kb'),
  COOKIE_SECRET: z.string().min(32),
  ENABLE_SWAGGER: boolFromEnv,
});

export type SecurityEnv = z.infer<typeof securitySchema>;
