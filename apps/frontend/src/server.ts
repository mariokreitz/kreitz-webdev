import {
  AngularNodeAppEngine,
  type AngularNodeAppEngineOptions,
  createNodeRequestHandler,
  isMainModule,
} from '@angular/ssr/node';
import { environment } from '@shared/environments';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveAllowedHosts } from './server/allowed-hosts';
import { registerContactFormRoute } from './server/routes/contact-form.route';
import { registerCvDownloadRoute } from './server/routes/cv-download.route';
import { registerHealthRoute } from './server/routes/health.route';
import { registerSsrRoute } from './server/routes/ssr.route';

try {
  process.loadEnvFile(resolve(process.cwd(), '.env.local'));
} catch (error) {
  void error;
}

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const port = Number(process.env['FRONTEND_PORT']) || 4000;
const apiBaseUrl = environment.api.kreitzWebdev;
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

registerContactFormRoute(app, apiBaseUrl);
registerCvDownloadRoute(app, apiBaseUrl);
registerHealthRoute(app);
registerSsrRoute(app, angularApp, apiBaseUrl);

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  app.listen(port, () => {
    console.warn(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
