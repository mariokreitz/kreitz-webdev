import { CONTACT_EMAIL_PATTERN, CONTACT_FORM_MESSAGE_MAX_LENGTH, CONTACT_FORM_NAME_MAX_LENGTH } from './config';
import type { ContactFormPayload } from './submit-contact-form';

export interface ContactFormRequestBody extends ContactFormPayload {
  readonly honeypot: string;
  readonly renderedAtMs: number;
}

export function isContactFormRequestBody(body: unknown): body is ContactFormRequestBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { name, email, message, honeypot, renderedAtMs } = body as Record<string, unknown>;

  return (
    typeof name === 'string' &&
    name.trim().length > 0 &&
    name.length <= CONTACT_FORM_NAME_MAX_LENGTH &&
    typeof email === 'string' &&
    CONTACT_EMAIL_PATTERN.test(email) &&
    typeof message === 'string' &&
    message.trim().length > 0 &&
    message.length <= CONTACT_FORM_MESSAGE_MAX_LENGTH &&
    typeof honeypot === 'string' &&
    typeof renderedAtMs === 'number' &&
    Number.isFinite(renderedAtMs)
  );
}
