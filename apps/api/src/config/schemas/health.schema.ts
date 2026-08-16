import { z } from 'zod';

export const healthSchema = z.object({
  HEALTH_HEAP_MB: z.coerce.number().int().positive().default(512),
  HEALTH_DB_TIMEOUT_MS: z.coerce.number().int().positive().default(2_000),
});

export type HealthEnv = z.infer<typeof healthSchema>;
