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
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

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
      }),
    }),
    PrismaModule,
    RedisModule,
    EmailModule,
    AuthModule,
  ],
  exports: [ConfigModule, PrismaModule, RedisModule, EmailModule],
})
export class CoreModule {}
