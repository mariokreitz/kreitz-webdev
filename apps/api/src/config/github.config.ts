import { type GithubEnv, githubSchema } from '@app/config/schemas/github.schema';
import type { ConfigType } from '@nestjs/config';
import { registerAs } from '@nestjs/config';

export const githubConfig = registerAs('github', () => {
  const env: GithubEnv = githubSchema.parse(process.env);

  return {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
});

export type GithubConfig = ConfigType<typeof githubConfig>;
