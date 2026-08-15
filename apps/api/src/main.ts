import { ApiModule } from '@app/api.module';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    bufferLogs: true,
  });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  // eslint-disable-next-line no-restricted-properties
  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

void bootstrap();
