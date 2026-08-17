import { z } from 'zod';

export const arcjetSchema = z.object({
  ARCJET_KEY: z.string().min(1),
});

export type ArcjetEnv = z.infer<typeof arcjetSchema>;
