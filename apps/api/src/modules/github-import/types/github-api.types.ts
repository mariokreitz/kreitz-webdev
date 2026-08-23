import { z } from 'zod';

export const githubRepoApiResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
  private: z.boolean(),
  updated_at: z.string(),
  owner: z.object({
    id: z.number(),
    login: z.string(),
  }),
});

export type GithubRepoApiResponse = z.infer<typeof githubRepoApiResponseSchema>;
