import {
  AngularNodeAppEngine,
  type AngularNodeAppEngineOptions,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { type NextFunction, type Request, type Response } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

function toHostname(candidate: string): string {
  try {
    return new URL(candidate).hostname;
  } catch {
    return candidate;
  }
}

const app = express();
const port = Number(process.env['PORTAL_PORT']) || 4201;
const allowedHostsEnv = process.env['NG_ALLOWED_HOSTS'] || process.env['APP_BASE_URL'];
const parsedHosts: string[] = [];
if (allowedHostsEnv) {
  parsedHosts.push(
    ...allowedHostsEnv
      .split(',')
      .map((host) => toHostname(host.trim()))
      .filter(Boolean),
  );
}
const defaultLocal = ['localhost', `localhost:${port}`, '127.0.0.1', `127.0.0.1:${port}`, '[::1]', `[::1]:${port}`];
const allowList = Array.from(new Set([...defaultLocal, ...parsedHosts]));
const engineOptions: AngularNodeAppEngineOptions = {
  allowedHosts: allowList,
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
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req: Request, res: Response, next: NextFunction) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (response) {
        await writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    })
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  app.listen(port, () => {
    console.warn(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
