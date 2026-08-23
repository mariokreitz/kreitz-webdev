import { RedisConfig, redisConfig } from '@app/config/redis.config';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public readonly client: Redis;

  constructor(
    @Inject(redisConfig.KEY) config: RedisConfig,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisService.name);

    this.client = new Redis(config.url, {
      keyPrefix: config.keyPrefix,
      connectTimeout: config.connectTimeoutMs,
      commandTimeout: config.commandTimeoutMs,
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.client.ping();
    this.logger.info('Connected to Redis');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
