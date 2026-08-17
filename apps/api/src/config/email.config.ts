import { type EmailEnv, emailSchema } from '@app/config/schemas/email.schema';
import type { ConfigType } from '@nestjs/config';
import { registerAs } from '@nestjs/config';

export const emailConfig = registerAs('email', () => {
  const env: EmailEnv = emailSchema.parse(process.env);

  return {
    resendApiKey: env.RESEND_API_KEY,
    fromAddress: env.RESEND_FROM,
  };
});

export type EmailConfig = ConfigType<typeof emailConfig>;
