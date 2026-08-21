import { type AuthConfig, authConfig } from '@app/config/auth.config';
import { type GithubConfig, githubConfig } from '@app/config/github.config';
import { type SecurityConfig, securityConfig } from '@app/config/security.config';
import { type VerificationConfig, verificationConfig } from '@app/config/verification.config';
import { ArcjetAuthMiddleware } from '@app/core/auth/middlewares/arcjet-auth.middleware';
import { EmailService } from '@app/core/email';
import { PrismaService } from '@app/core/prisma';
import { RedisService } from '@app/core/redis';
import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthNestModule } from '@thallesp/nestjs-better-auth';
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
      ],
      useFactory: (
        prisma: PrismaService,
        redis: RedisService,
        auth: AuthConfig,
        github: GithubConfig,
        security: SecurityConfig,
        email: EmailService,
        verification: VerificationConfig,
      ) => ({
        auth: createAuth({
          apiKey: auth.apiKey,
          prisma,
          redisClient: redis.client,
          secret: auth.secret,
          baseUrl: auth.baseUrl,
          githubClientId: github.clientId,
          githubClientSecret: github.clientSecret,
          trustedOrigins: security.corsOrigins,
          sendVerificationEmail: async ({ to, url }) => email.sendVerificationEmail({ to, url }),
          sendExistingAccountNotice: async ({ to }) => email.sendExistingAccountNotice({ to }),
          verificationTokenTtlMs: verification.tokenTtlMs,
          enableDocs: security.enableSwagger,
        }),
        bodyParser: {
          json: { limit: security.bodyLimit },
          urlencoded: { limit: security.bodyLimit, extended: false },
        },
      }),
    }),
  ],
  providers: [ArcjetAuthMiddleware],
})
export class AuthModule {}
