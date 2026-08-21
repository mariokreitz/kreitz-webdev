import { type AppEnv, appSchema } from '@app/config/schemas/app.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => {
  const env: AppEnv = appSchema.parse(process.env);

  return {
    env: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL ?? (env.NODE_ENV === 'production' ? 'warn' : 'debug'),
    isProduction: env.NODE_ENV === 'production',
  };
});

export type AppConfig = ConfigType<typeof appConfig>;
