import { type Env, envSchema } from '@app/config/schemas/schemas';

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`).join('\n');

    throw new Error(`Invalid environment variables:\n${details}`);
  }

  return result.data;
}
