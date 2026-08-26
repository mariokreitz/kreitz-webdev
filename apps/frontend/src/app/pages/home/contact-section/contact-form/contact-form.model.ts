import * as z from 'zod';

export const NAME_MIN_LENGTH = 1;
export const NAME_MAX_LENGTH = 100;
export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 5000;

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(NAME_MIN_LENGTH, 'contactForm.errors.nameRequired')
    .max(NAME_MAX_LENGTH, 'contactForm.errors.nameTooLong'),
  email: z.email('contactForm.errors.emailInvalid'),
  message: z
    .string()
    .min(MESSAGE_MIN_LENGTH, 'contactForm.errors.messageRequired')
    .max(MESSAGE_MAX_LENGTH, 'contactForm.errors.messageTooLong'),
});

export type ContactFormValue = z.infer<typeof contactFormSchema>;

export type ContactFormStatus = 'idle' | 'submitting' | 'success' | 'error' | 'rate-limited';

export interface ContactFormSubmission extends ContactFormValue {
  readonly honeypot: string;
  readonly renderedAtMs: number;
}
