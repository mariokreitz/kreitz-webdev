import { type ThrottleEnv, throttleSchema } from '@app/config/schemas/throttle.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const throttleConfig = registerAs('throttle', () => {
  const env: ThrottleEnv = throttleSchema.parse(process.env);

  return {
    trustProxy: env.THROTTLE_TRUST_PROXY,
    failOpen: env.THROTTLE_FAIL_OPEN,
    circuitCooldownMs: env.THROTTLE_CIRCUIT_COOLDOWN_MS,
    // Drei gestaffelte Limits: Bursts, Scraping, Tagesbudget.
    throttlers: [
      { name: 'short', ttl: 1_000, limit: env.THROTTLE_SHORT_LIMIT },
      { name: 'medium', ttl: 10_000, limit: env.THROTTLE_MEDIUM_LIMIT },
      { name: 'long', ttl: 60_000, limit: env.THROTTLE_LONG_LIMIT },
    ],
  };
});

export type ThrottleConfig = ConfigType<typeof throttleConfig>;
