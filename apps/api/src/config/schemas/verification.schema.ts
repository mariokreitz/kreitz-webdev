import { z } from 'zod';

export const verificationSchema = z.object({
  VERIFICATION_TOKEN_TTL_MS: z.coerce.number().int().positive().default(86_400_000),
  VERIFICATION_MAX_PER_HOUR: z.coerce.number().int().positive().default(3),
  VERIFICATION_ENFORCEMENT_MODE: z.enum(['off', 'warn', 'enforce']).default('warn'),
  VERIFICATION_GRACE_PERIOD_MS: z.coerce.number().int().min(0).default(604_800_000),
});

export type VerificationEnv = z.infer<typeof verificationSchema>;
