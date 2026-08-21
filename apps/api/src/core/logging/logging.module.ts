import { appConfig, type AppConfig } from '@app/config';
import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule, type Params } from 'nestjs-pino';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { getLogger, setLogger } from './logger-registry';
import { createPinoHttpOptions } from './pino-options.factory';
import { RequestIdMiddleware } from './request-id.middleware';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (config: AppConfig): Params => {
        const options = createPinoHttpOptions({
          isProduction: config.isProduction,
          logLevel: config.logLevel,
        });

        const logger = pino({
          level: options.level,
          redact: options.redact,
          base: options.base,
          ...(options.transport ? { transport: options.transport } : {}),
        });

        setLogger(logger);

        return {
          pinoHttp: { logger, autoLogging: false },
        };
      },
    }),
  ],
})
export class LoggingModule implements NestModule {
  constructor(@Inject(appConfig.KEY) private readonly config: AppConfig) {}

  public configure(consumer: MiddlewareConsumer): void {
    const options = createPinoHttpOptions({
      isProduction: this.config.isProduction,
      logLevel: this.config.logLevel,
    });

    const requestLogger = pinoHttp({
      logger: getLogger(),
      genReqId: options.genReqId,
      customLogLevel: options.customLogLevel,
      customProps: options.customProps,
      serializers: options.serializers,
      wrapSerializers: options.wrapSerializers,
    });

    consumer.apply(RequestIdMiddleware, requestLogger).forRoutes('*path');
  }
}
