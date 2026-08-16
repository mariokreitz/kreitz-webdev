import { z } from 'zod';

export const boolFromEnv = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

export const boolFromEnvDefaultTrue = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true');

export const redisUrl = z.string().refine((value) => value.startsWith('redis://') || value.startsWith('rediss://'), {
  message: 'must start with redis:// or rediss://',
});
