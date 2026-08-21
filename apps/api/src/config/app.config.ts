import { type AppEnv, appSchema } from '@app/config/schemas/app.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => {
  const env: AppEnv = appSchema.parse(process.env);
  const isProduction = env.NODE_ENV === 'production';

  return {
    env: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL ?? (isProduction ? 'warn' : 'debug'),
    logFormat: env.LOG_FORMAT ?? (isProduction ? 'json' : 'pretty'),
    isProduction,
  };
});

export type AppConfig = ConfigType<typeof appConfig>;
