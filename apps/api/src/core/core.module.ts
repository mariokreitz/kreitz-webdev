import {
  appConfig,
  arcjetConfig,
  type ArcjetConfig,
  authConfig,
  databaseConfig,
  emailConfig,
  githubConfig,
  healthConfig,
  redisConfig,
  resetConfig,
  securityConfig,
  throttleConfig,
  validateEnv,
  verificationConfig,
} from '@app/config';
import { ArcjetModule, shield } from '@arcjet/nest';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth';
import { EmailModule } from './email';
import { HealthModule } from './health';
import { LoggingModule } from './logging';
import { PrismaModule } from './prisma';
import { RedisModule } from './redis';

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
        arcjetConfig,
        authConfig,
        databaseConfig,
        emailConfig,
        githubConfig,
        healthConfig,
        redisConfig,
        resetConfig,
        securityConfig,
        throttleConfig,
        verificationConfig,
      ],
    }),
    ArcjetModule.forRootAsync({
      isGlobal: true,
      inject: [arcjetConfig.KEY],
      useFactory: (arcjet: ArcjetConfig) => ({
        key: arcjet.key,
        rules: [shield({ mode: 'LIVE' })],
        ...(arcjet.trustedProxies.length > 0 ? { proxies: arcjet.trustedProxies } : {}),
      }),
    }),
    PrismaModule,
    RedisModule,
    EmailModule,
    AuthModule,
    HealthModule,
    LoggingModule,
  ],
  exports: [ConfigModule, PrismaModule, RedisModule, EmailModule],
})
export class CoreModule {}
