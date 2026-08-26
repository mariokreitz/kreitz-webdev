import * as z from 'zod';

const PublicCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().nullable(),
  logoUrl: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

export type PublicCompany = z.infer<typeof PublicCompanySchema>;

export function isPublicCompany(value: unknown): value is PublicCompany {
  return PublicCompanySchema.safeParse(value).success;
}
