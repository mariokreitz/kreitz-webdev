import { ApiModule } from '@app/api.module';
import {
  API_GLOBAL_PREFIX,
  type BootstrapContext,
  configureApplication,
  setupSwagger,
  SWAGGER_PATH,
} from '@app/bootstrap';
import { type AppConfig, appConfig, type SecurityConfig, securityConfig } from '@app/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    bufferLogs: true,
  });

  const context: BootstrapContext = {
    config: app.get<AppConfig>(appConfig.KEY),
    security: app.get<SecurityConfig>(securityConfig.KEY),
  };

  configureApplication(app, context);

  const swaggerEnabled: boolean = setupSwagger(app, context);

  await app.listen(context.config.port);
  Logger.log(`🚀 Application is running on: http://localhost:${context.config.port}/${API_GLOBAL_PREFIX}`);
  Logger.log(
    swaggerEnabled
      ? `📚 API documentation: http://localhost:${context.config.port}/${SWAGGER_PATH}`
      : '📚 API documentation is disabled (SWAGGER_ENABLED)',
  );
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
