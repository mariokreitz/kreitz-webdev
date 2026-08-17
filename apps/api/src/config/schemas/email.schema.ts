import { z } from 'zod';

export const emailSchema = z.object({
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM: z.string().min(1).default('Kreitz WebDev <onboarding@resend.dev>'),
});

export type EmailEnv = z.infer<typeof emailSchema>;
