import { z } from 'zod';

export const authSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

export type AuthEnv = z.infer<typeof authSchema>;
