import { RedisConfig, redisConfig } from '@app/config/redis.config';
import { createKeyvNonBlocking } from '@keyv/redis';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Cacheable, KeyvCacheableMemory } from 'cacheable';
import { PinoLogger } from 'nestjs-pino';
import { CacheEntry } from './types/cache-entry.type';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly cache: Cacheable;

  constructor(
    @Inject(redisConfig.KEY) config: RedisConfig,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CacheService.name);

    const primary = new KeyvCacheableMemory({ ttl: config.memoryTtlMs, lruSize: config.memoryLruSize });
    const secondary = createKeyvNonBlocking(config.url, { namespace: config.keyPrefix });
    secondary.ttl = config.ttlMs;

    this.cache = new Cacheable({ primary, secondary, nonBlocking: true });
    this.cache.on('error', (error: unknown) => {
      this.logger.warn({
        event: 'cache.store_error',
        reason: error instanceof Error ? error.message : String(error),
      });
    });

    this.logger.info({ event: 'cache.initialized' });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.cache.disconnect();
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const entry = await this.cache.get<CacheEntry<T>>(key);
    if (entry === undefined) {
      return undefined;
    }
    return entry.found ? entry.value : (null as T);
  }

  public async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const entry: CacheEntry<unknown> = value === null ? { found: false } : { found: true, value };
    await this.cache.set(key, entry, ttlMs);
  }

  public async del(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  public async getOrSet<T>(key: string, ttlMs: number | undefined, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await loader();
    await this.set(key, value, ttlMs);

    return value;
  }
}
