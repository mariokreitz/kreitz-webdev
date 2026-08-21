import { z } from 'zod';

export const appSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
  LOG_FORMAT: z.enum(['pretty', 'json']).optional(),
});

export type AppEnv = z.infer<typeof appSchema>;
