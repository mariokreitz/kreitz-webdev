import { z } from 'zod';

export const authSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_API_KEY: z.string(),
});

export type AuthEnv = z.infer<typeof authSchema>;
