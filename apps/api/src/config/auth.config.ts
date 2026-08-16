import { type AuthEnv, authSchema } from '@app/config/schemas/auth.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => {
  const env: AuthEnv = authSchema.parse(process.env);

  return {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtIssuer: env.JWT_ISSUER,
    jwtAudience: env.JWT_AUDIENCE,
    refreshTtlMs: env.REFRESH_TTL_MS,
    maxFailedLogins: env.MAX_FAILED_LOGINS,
    lockoutMs: env.LOCKOUT_MS,
  };
});

export type AuthConfig = ConfigType<typeof authConfig>;
