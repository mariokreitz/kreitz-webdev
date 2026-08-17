import { z } from 'zod';

export const githubSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

export type GithubEnv = z.infer<typeof githubSchema>;
