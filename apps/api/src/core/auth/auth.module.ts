import { type ArcjetConfig, arcjetConfig } from '@app/config/arcjet.config';
import { type AuthConfig, authConfig } from '@app/config/auth.config';
import { type GithubConfig, githubConfig } from '@app/config/github.config';
import { type ResetConfig, resetConfig } from '@app/config/reset.config';
import { type SecurityConfig, securityConfig } from '@app/config/security.config';
import { type VerificationConfig, verificationConfig } from '@app/config/verification.config';
import { ArcjetAuthMiddleware } from '@app/core/auth/middlewares/arcjet-auth.middleware';
import { EmailService } from '@app/core/email';
import { PrismaService } from '@app/database/prisma';
import { RedisService } from '@app/database/redis';
import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthNestModule } from '@thallesp/nestjs-better-auth';
import { PinoLogger } from 'nestjs-pino';
import { createAuth } from './strategies/auth.factory';

@Module({
  imports: [
    BetterAuthNestModule.forRootAsync({
      inject: [
        PrismaService,
        RedisService,
        authConfig.KEY,
        githubConfig.KEY,
        securityConfig.KEY,
        EmailService,
        verificationConfig.KEY,
        arcjetConfig.KEY,
        resetConfig.KEY,
        PinoLogger,
      ],
      useFactory: (
        prisma: PrismaService,
        redis: RedisService,
        auth: AuthConfig,
        github: GithubConfig,
        security: SecurityConfig,
        email: EmailService,
        verification: VerificationConfig,
        arcjet: ArcjetConfig,
        reset: ResetConfig,
        logger: PinoLogger,
      ) => {
        logger.setContext('AuthFactory');

        return {
          auth: createAuth({
            apiKey: auth.apiKey,
            prisma,
            redisClient: redis.client,
            secret: auth.secret,
            baseUrl: auth.baseUrl,
            githubClientId: github.clientId,
            githubClientSecret: github.clientSecret,
            trustedOrigins: security.corsOrigins,
            trustedProxies: arcjet.trustedProxies,
            errorUrl: `${reset.baseUrl}/auth/error`,
            sendVerificationEmail: async ({ to, url }) => email.sendVerificationEmail({ to, url }),
            sendExistingAccountNotice: async ({ to }) => email.sendExistingAccountNotice({ to }),
            verificationTokenTtlMs: verification.tokenTtlMs,
            enableDocs: security.enableSwagger,
            logger,
          }),
          bodyParser: {
            json: { limit: security.bodyLimit },
            urlencoded: { limit: security.bodyLimit, extended: false },
          },
        };
      },
    }),
  ],
  providers: [ArcjetAuthMiddleware],
})
export class AuthModule {}
