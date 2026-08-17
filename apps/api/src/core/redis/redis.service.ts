import { RedisConfig, redisConfig } from '@app/config/redis.config';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger = new Logger(RedisService.name);

  public readonly client: Redis;

  constructor(@Inject(redisConfig.KEY) config: RedisConfig) {
    this.client = new Redis(config.url, {
      keyPrefix: config.keyPrefix,
      connectTimeout: config.connectTimeoutMs,
      commandTimeout: config.commandTimeoutMs,
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.client.ping();
    this.logger.log('Connected to Redis');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
