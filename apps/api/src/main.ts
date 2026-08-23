import { ApiModule } from '@app/api.module';
import {
  API_GLOBAL_PREFIX,
  AUTH_REFERENCE_PATH,
  type BootstrapContext,
  configureApplication,
  setupSwagger,
  SWAGGER_PATH,
} from '@app/bootstrap';
import { GlobalExceptionFilter } from '@app/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@app/common/interceptors/response.interceptor';
import { type AppConfig, appConfig, type SecurityConfig, securityConfig } from '@app/config';
import { Logger as NestLogger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

let bootstrapLogger: Logger | undefined;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const logger = app.get(Logger);
  bootstrapLogger = logger;
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor(), new ResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost).httpAdapter));

  const context: BootstrapContext = {
    config: app.get<AppConfig>(appConfig.KEY),
    security: app.get<SecurityConfig>(securityConfig.KEY),
  };

  configureApplication(app, context);

  const swaggerEnabled: boolean = setupSwagger(app, context);

  await app.listen(context.config.port);

  logger.log({
    event: 'bootstrap.listening',
    url: `http://localhost:${context.config.port}/${API_GLOBAL_PREFIX}`,
  });

  if (swaggerEnabled) {
    logger.log({
      event: 'bootstrap.swagger_enabled',
      url: `http://localhost:${context.config.port}/${SWAGGER_PATH}`,
    });
    logger.log({
      event: 'bootstrap.auth_reference_enabled',
      url: `http://localhost:${context.config.port}${AUTH_REFERENCE_PATH}`,
    });
  } else {
    logger.log({ event: 'bootstrap.swagger_disabled' });
  }
}

bootstrap().catch((err: unknown) => {
  const error = err instanceof Error ? err.message : String(err);

  if (bootstrapLogger) {
    bootstrapLogger.error({ event: 'bootstrap.failed', error });
  } else {
    // Pino isn't resolvable yet if NestFactory.create itself threw, so fall back to Nest's static logger for this one unreachable-otherwise path.
    new NestLogger('Bootstrap').error({ event: 'bootstrap.failed', error });
  }

  process.exit(1);
});
