import { z } from 'zod';

export const githubSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.url(),
  GITHUB_STATE_TTL_MS: z.coerce.number().int().positive().default(600_000),
  /// Allowlist gegen Open Redirect nach dem Login.
  GITHUB_ALLOWED_RETURN_PATHS: z
    .string()
    .default('/')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
});

export type GithubEnv = z.infer<typeof githubSchema>;
