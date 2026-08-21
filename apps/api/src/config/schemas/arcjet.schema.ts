import { z } from 'zod';

const trustedProxyEntry = z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()]);

export const arcjetSchema = z.object({
  ARCJET_KEY: z.string().min(1),
  ARCJET_TRUSTED_PROXIES: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    )
    .pipe(z.array(trustedProxyEntry)),
});

export type ArcjetEnv = z.infer<typeof arcjetSchema>;
