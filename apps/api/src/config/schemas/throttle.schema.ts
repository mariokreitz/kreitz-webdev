import { z } from 'zod';

import { boolFromEnv, boolFromEnvDefaultTrue } from './common.schema';

export const throttleSchema = z.object({
  THROTTLE_SHORT_LIMIT: z.coerce.number().int().positive().default(5),
  THROTTLE_MEDIUM_LIMIT: z.coerce.number().int().positive().default(30),
  THROTTLE_LONG_LIMIT: z.coerce.number().int().positive().default(200),
  THROTTLE_TRUST_PROXY: boolFromEnv,
  THROTTLE_FAIL_OPEN: boolFromEnvDefaultTrue,
  THROTTLE_CIRCUIT_COOLDOWN_MS: z.coerce.number().int().positive().default(5_000),
});

export type ThrottleEnv = z.infer<typeof throttleSchema>;
