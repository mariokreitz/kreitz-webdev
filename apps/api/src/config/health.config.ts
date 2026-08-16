import { type HealthEnv, healthSchema } from '@app/config/schemas/health.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const healthConfig = registerAs('health', () => {
  const env: HealthEnv = healthSchema.parse(process.env);

  return {
    heapBytes: env.HEALTH_HEAP_MB * 1024 * 1024,
    dbTimeoutMs: env.HEALTH_DB_TIMEOUT_MS,
  };
});

export type HealthConfig = ConfigType<typeof healthConfig>;
