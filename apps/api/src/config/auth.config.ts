import { type AuthEnv, authSchema } from '@app/config/schemas/auth.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => {
  const env: AuthEnv = authSchema.parse(process.env);

  return {
    secret: env.BETTER_AUTH_SECRET,
    baseUrl: env.BETTER_AUTH_URL,
  };
});

export type AuthConfig = ConfigType<typeof authConfig>;
