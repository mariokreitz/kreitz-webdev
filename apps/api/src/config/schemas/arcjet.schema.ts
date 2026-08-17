import { z } from 'zod';

export const arcjetSchema = z.object({
  ARCJET_KEY: z.string().min(1),
  ARCJET_TRUSTED_PROXIES: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
});

export type ArcjetEnv = z.infer<typeof arcjetSchema>;
