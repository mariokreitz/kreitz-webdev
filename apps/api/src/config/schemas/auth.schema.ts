import { z } from 'zod';

export const authSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_ISSUER: z.string().default('app'),
  JWT_AUDIENCE: z.string().default('app-api'),
  REFRESH_TTL_MS: z.coerce.number().int().positive().default(604_800_000),
  MAX_FAILED_LOGINS: z.coerce.number().int().positive().default(5),
  LOCKOUT_MS: z.coerce.number().int().positive().default(900_000),
});

export type AuthEnv = z.infer<typeof authSchema>;
