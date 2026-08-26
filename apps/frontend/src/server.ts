import {
  AngularNodeAppEngine,
  type AngularNodeAppEngineOptions,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { environment } from '@shared/environments';
import express, { type NextFunction, type Request, type Response } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { HomeRequestContext } from './app/pages/home/public-project.model';
import { fetchCvAvailable } from './server/fetch-cv-status';
import { fetchCvFile } from './server/fetch-cv-file';
import { fetchPublicCompanies } from './server/fetch-public-companies';
import { fetchPublicProjects } from './server/fetch-public-projects';
import { submitContactForm, type ContactFormPayload } from './server/submit-contact-form';

try {
  process.loadEnvFile(resolve(process.cwd(), '.env.local'));
} catch {
  // .env.local is optional locally; real deployments provide env vars directly
}

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

function toHostname(candidate: string): string {
  try {
    return new URL(candidate).hostname;
  } catch {
    return candidate;
  }
}

function resolveAllowedHosts(port: number): string[] {
  const configuredHosts = process.env['NG_ALLOWED_HOSTS'] || process.env['APP_BASE_URL'];
  const parsedHosts: string[] = [];

  if (configuredHosts) {
    parsedHosts.push(
      ...configuredHosts
        .split(',')
        .map((host) => toHostname(host.trim()))
        .filter(Boolean),
    );
  }

  const defaultLocalHosts = [
    'localhost',
    `localhost:${port}`,
    '127.0.0.1',
    `127.0.0.1:${port}`,
    '[::1]',
    `[::1]:${port}`,
  ];

  return Array.from(new Set([...defaultLocalHosts, ...parsedHosts]));
}

const app = express();
const port = Number(process.env['FRONTEND_PORT']) || 4000;
const engineOptions: AngularNodeAppEngineOptions = {
  allowedHosts: resolveAllowedHosts(port),
  trustProxyHeaders: [
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-port',
    'x-forwarded-proto',
    'x-forwarded-prefix',
    'x-forwarded-server',
  ],
};
const angularApp = new AngularNodeAppEngine(engineOptions);

app.use(
  '/.well-known',
  express.static(resolve(browserDistFolder, '.well-known'), {
    dotfiles: 'allow',
    index: false,
  }),
);

// WHY: unhashed filenames (en.json/de.json) can't rely on the 1y cache below for freshness, but a
// short max-age (rather than a per-request cache-busting query param) keeps the URL stable so the
// HTTP transfer cache can dedupe the SSR fetch against the client's post-hydration request.
app.use(
  '/assets/i18n',
  express.static(resolve(browserDistFolder, 'assets/i18n'), {
    maxAge: '5m',
    index: false,
  }),
);

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

const CONTACT_FORM_NAME_MAX_LENGTH = 100;
const CONTACT_FORM_MESSAGE_MAX_LENGTH = 5000;
const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_FORM_MIN_FILL_TIME_MS = 1_200;
// WHY: sized above the 5000-char message cap (a few KB even with multi-byte characters) rather than
// a tighter default, since express.json rejects an oversized body before SubmitContactFormDto's own
// @MaxLength check ever runs.
const contactFormJsonParser = express.json({ limit: '32kb' });

interface ContactFormRequestBody extends ContactFormPayload {
  readonly honeypot: string;
  readonly renderedAtMs: number;
}

function isContactFormRequestBody(body: unknown): body is ContactFormRequestBody {
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

app.post('/api/contact', contactFormJsonParser, (req: Request, res: Response) => {
  void handleContactFormSubmission(req, res);
});

async function handleContactFormSubmission(req: Request, res: Response): Promise<void> {
  const body: unknown = req.body;

  if (!isContactFormRequestBody(body)) {
    res.status(400).json({ ok: false, error: 'invalid_payload' });
    return;
  }

  // WHY: a filled honeypot field or a submission faster than a human could plausibly type name,
  // email, and a message is treated as automated traffic. We report a fake success so the bot gets
  // no signal to adapt, without spending the API's rate-limit budget or sending an email.
  const isLikelyBot = body.honeypot.trim() !== '' || Date.now() - body.renderedAtMs < CONTACT_FORM_MIN_FILL_TIME_MS;

  if (isLikelyBot) {
    res.status(200).json({ ok: true });
    return;
  }

  const result = await submitContactForm(environment.api.kreitzWebdev, {
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

app.get('/api/cv/download', (_req: Request, res: Response) => {
  void handleCvDownload(res);
});

async function handleCvDownload(res: Response): Promise<void> {
  const result = await fetchCvFile(environment.api.kreitzWebdev);

  if (!result.ok || !result.body) {
    res.status(result.status === 404 ? 404 : 502).end();
    return;
  }

  res.setHeader('Content-Type', result.contentType ?? 'application/pdf');

  if (result.contentDisposition) {
    res.setHeader('Content-Disposition', result.contentDisposition);
  }

  res.status(200).send(result.body);
}

app.use((req: Request, res: Response, next: NextFunction) => {
  void handleRequest(req, res, next);
});

async function buildHomeRequestContext(): Promise<HomeRequestContext> {
  const [projects, companies, cvAvailable] = await Promise.all([
    fetchPublicProjects(environment.api.kreitzWebdev),
    fetchPublicCompanies(environment.api.kreitzWebdev),
    fetchCvAvailable(environment.api.kreitzWebdev),
  ]);

  return { projects, companies, cvAvailable };
}

async function handleRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestContext: HomeRequestContext | undefined =
      req.path === '/' ? await buildHomeRequestContext() : undefined;

    const response = await angularApp.handle(req, requestContext);

    if (response) {
      await writeResponseToNodeResponse(response, res);
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
}

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  app.listen(port, () => {
    console.warn(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
