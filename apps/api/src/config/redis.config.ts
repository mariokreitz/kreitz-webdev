import { type RedisEnv, redisSchema } from '@app/config/schemas/redis.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => {
  const env: RedisEnv = redisSchema.parse(process.env);

  return {
    url: env.REDIS_URL,
    keyPrefix: env.REDIS_KEY_PREFIX,
    commandTimeoutMs: env.REDIS_COMMAND_TIMEOUT_MS,
    connectTimeoutMs: env.REDIS_CONNECT_TIMEOUT_MS,
    ttlMs: env.CACHE_TTL_MS,
    memoryTtlMs: env.CACHE_MEMORY_TTL_MS,
    memoryLruSize: env.CACHE_MEMORY_LRU_SIZE,
    queuePrefix: env.QUEUE_PREFIX,
  };
});

export type RedisConfig = ConfigType<typeof redisConfig>;
