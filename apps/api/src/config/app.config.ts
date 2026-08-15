import { appSchema } from '@app/config/schemas/schemas';
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => {
  const env = appSchema.parse(process.env);

  return {
    env: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    isProduction: env.NODE_ENV === 'production',
  };
});
