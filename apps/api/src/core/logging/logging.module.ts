import { appConfig, type AppConfig } from '@app/config';
import { RequestIdMiddleware } from '@app/core/logging/request-id.middleware';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule, type Params } from 'nestjs-pino';
import { createPinoHttpOptions } from './strategies/pino-options.factory';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (config: AppConfig): Params =>
        createPinoHttpOptions({ logLevel: config.logLevel, logFormat: config.logFormat }),
    }),
  ],
})
export class LoggingModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
