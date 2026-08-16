import { type SecurityEnv, securitySchema } from '@app/config/schemas/security.schema';
import { registerAs } from '@nestjs/config';

export const securityConfig = registerAs('security', () => {
  const env: SecurityEnv = securitySchema.parse(process.env);

  return {
    corsOrigins: env.CORS_ORIGINS,
    corsCredentials: env.CORS_CREDENTIALS,
    bodyLimit: env.BODY_LIMIT,
    cookieSecret: env.COOKIE_SECRET,
    enableSwagger: env.ENABLE_SWAGGER,
  };
});
