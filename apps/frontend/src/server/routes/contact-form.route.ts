import express, { type Express, type Request, type Response } from 'express';

import { CONTACT_FORM_JSON_BODY_LIMIT, CONTACT_FORM_MIN_FILL_TIME_MS } from '../config';
import { isContactFormRequestBody } from '../contact-form-request-body.model';
import { submitContactForm } from '../submit-contact-form';

export function registerContactFormRoute(app: Express, apiBaseUrl: string): void {
  const contactFormJsonParser = express.json({ limit: CONTACT_FORM_JSON_BODY_LIMIT });

  app.post('/api/contact', contactFormJsonParser, (req: Request, res: Response) => {
    void handleContactFormSubmission(apiBaseUrl, req, res);
  });
}

async function handleContactFormSubmission(apiBaseUrl: string, req: Request, res: Response): Promise<void> {
  const body: unknown = req.body;

  if (!isContactFormRequestBody(body)) {
    res.status(400).json({ ok: false, error: 'invalid_payload' });
    return;
  }

  const isLikelyBot = body.honeypot.trim() !== '' || Date.now() - body.renderedAtMs < CONTACT_FORM_MIN_FILL_TIME_MS;

  if (isLikelyBot) {
    res.status(200).json({ ok: true });
    return;
  }

  const result = await submitContactForm(apiBaseUrl, {
    name: body.name.trim(),
    email: body.email.trim(),
    message: body.message.trim(),
  });

  if (result.ok) {
    res.status(200).json({ ok: true });
    return;
  }

  res.status(result.status === 429 ? 429 : 502).json({ ok: false, error: 'send_failed' });
}
