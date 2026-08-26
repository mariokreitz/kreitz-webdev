import * as z from 'zod';

const PROJECT_CATEGORIES = ['DEMO', 'OPEN_SOURCE', 'POC', 'MVP', 'PLATFORM'] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

const PublicProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  repoUrl: z.string().nullable(),
  liveUrl: z.string().nullable(),
  tags: z.array(z.string()),
  imageUrl: z.string().nullable(),
  category: z.enum(PROJECT_CATEGORIES).nullish(),
  githubStars: z.number().nullish(),
  githubCreatedAt: z.string().nullish(),
  githubUpdatedAt: z.string().nullish(),
});

export type PublicProject = z.infer<typeof PublicProjectSchema>;

export function isPublicProject(value: unknown): value is PublicProject {
  return PublicProjectSchema.safeParse(value).success;
}
