import { z } from 'zod';

export const resetSchema = z.object({
  RESET_TOKEN_TTL_MS: z.coerce.number().int().positive().default(1_800_000),
  RESET_MAX_PER_EMAIL_PER_HOUR: z.coerce.number().int().positive().default(3),
  APP_BASE_URL: z.url(),
});

export type ResetEnv = z.infer<typeof resetSchema>;
