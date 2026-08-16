import { type ResetEnv, resetSchema } from '@app/config/schemas/reset.schema';
import { registerAs } from '@nestjs/config';

export const resetConfig = registerAs('reset', () => {
  const env: ResetEnv = resetSchema.parse(process.env);

  return {
    tokenTtlMs: env.RESET_TOKEN_TTL_MS,
    maxPerEmailPerHour: env.RESET_MAX_PER_EMAIL_PER_HOUR,
    baseUrl: env.APP_BASE_URL.replace(/\/+$/, ''),
  };
});
