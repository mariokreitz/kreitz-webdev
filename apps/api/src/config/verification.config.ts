import { type VerificationEnv, verificationSchema } from '@app/config/schemas/verification.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const verificationConfig = registerAs('verification', () => {
  const env: VerificationEnv = verificationSchema.parse(process.env);

  return {
    tokenTtlMs: env.VERIFICATION_TOKEN_TTL_MS,
    maxPerHour: env.VERIFICATION_MAX_PER_HOUR,
    enforcementMode: env.VERIFICATION_ENFORCEMENT_MODE,
    gracePeriodMs: env.VERIFICATION_GRACE_PERIOD_MS,
  };
});

export type VerificationConfig = ConfigType<typeof verificationConfig>;
