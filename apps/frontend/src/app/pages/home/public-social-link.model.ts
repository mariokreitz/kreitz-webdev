import * as z from 'zod';

const PublicSocialLinkSchema = z.object({
  id: z.string(),
  platform: z.string(),
  label: z.string().nullable(),
  url: z.string(),
  sortOrder: z.number(),
});

export type PublicSocialLink = z.infer<typeof PublicSocialLinkSchema>;

export function isPublicSocialLink(value: unknown): value is PublicSocialLink {
  return PublicSocialLinkSchema.safeParse(value).success;
}
