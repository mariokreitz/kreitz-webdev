import { ApiModule } from '@app/api.module';
import { appConfig, securityConfig, throttleConfig } from '@app/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { join } from 'node:path';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    bufferLogs: true,
  });

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const throttle = app.get<ConfigType<typeof throttleConfig>>(throttleConfig.KEY);
  const security = app.get<ConfigType<typeof securityConfig>>(securityConfig.KEY);

  app.set('etag', false);
  app.disable('x-powered-by');

  if (throttle.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      hsts: config.isProduction ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  app.use(cookieParser(security.cookieSecret));
  app.use(json({ limit: security.bodyLimit }));
  app.use(urlencoded({ extended: false, limit: security.bodyLimit }));

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/.well-known',
    index: false,
    dotfiles: 'allow',
  });

  if (security.corsOrigins.length > 0) {
    app.enableCors({
      origin: security.corsOrigins,
      credentials: security.corsCredentials,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Lang'],
      maxAge: 86_400,
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: false },
      disableErrorMessages: config.isProduction,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(config.port);

  new Logger('Bootstrap').log(`API running in ${config.env} on port ${config.port}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');

  if (err instanceof Error) {
    logger.error(`Application failed to start: ${err.message}`, err.stack);
  } else {
    logger.error('Application failed to start', String(err));
  }

  process.exit(1);
});
