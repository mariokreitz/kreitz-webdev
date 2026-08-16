import { z } from 'zod';

import { boolFromEnv } from './common.schema';

export const databaseSchema = z.object({
  DATABASE_URL: z.url().startsWith('postgresql://'),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_LOG_QUERIES: boolFromEnv,
});

export type DatabaseEnv = z.infer<typeof databaseSchema>;
