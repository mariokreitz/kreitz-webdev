import { type Env, envSchema } from '@app/config/schemas/schemas';
import { z } from 'zod';

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const details = z.prettifyError(result.error);

    throw new Error(`Invalid environment variables:\n${details}`);
  }

  return result.data;
}
