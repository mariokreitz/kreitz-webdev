import { z } from 'zod';

import { redisUrl } from './common.schema';

export const redisSchema = z.object({
  REDIS_URL: redisUrl,
  REDIS_KEY_PREFIX: z.string().min(1).default('app'),
  REDIS_COMMAND_TIMEOUT_MS: z.coerce.number().int().positive().default(1_000),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  CACHE_MEMORY_TTL_MS: z.coerce.number().int().positive().default(10_000),
  CACHE_MEMORY_LRU_SIZE: z.coerce.number().int().positive().default(1_000),
  /// BullMQ mag keinen ioredis keyPrefix. Es hat seine eigene prefix-Option.
  QUEUE_PREFIX: z.string().min(1).default('app-queue'),
});

export type RedisEnv = z.infer<typeof redisSchema>;
