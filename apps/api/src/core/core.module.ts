import {
  appConfig,
  authConfig,
  databaseConfig,
  githubConfig,
  healthConfig,
  redisConfig,
  resetConfig,
  securityConfig,
  throttleConfig,
  validateEnv,
  verificationConfig,
} from '@app/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      skipProcessEnv: true,
      ignoreEnvFile: NODE_ENV === 'production',
      envFilePath: [`.env.${NODE_ENV}`, '.env.local', '.env'],
      validate: validateEnv,
      load: [
        appConfig,
        authConfig,
        databaseConfig,
        githubConfig,
        healthConfig,
        redisConfig,
        resetConfig,
        securityConfig,
        throttleConfig,
        verificationConfig,
      ],
    }),
  ],
  exports: [ConfigModule],
})
export class CoreModule {}
