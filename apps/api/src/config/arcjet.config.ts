import { type ArcjetEnv, arcjetSchema } from '@app/config/schemas/arcjet.schema';
import type { ConfigType } from '@nestjs/config';
import { registerAs } from '@nestjs/config';

export const arcjetConfig = registerAs('arcjet', () => {
  const env: ArcjetEnv = arcjetSchema.parse(process.env);

  return {
    key: env.ARCJET_KEY,
    trustedProxies: env.ARCJET_TRUSTED_PROXIES,
  };
});

export type ArcjetConfig = ConfigType<typeof arcjetConfig>;
