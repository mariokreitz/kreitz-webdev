import {
  AngularNodeAppEngine,
  AngularNodeAppEngineOptions,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { type Express } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder: string = dirname(fileURLToPath(import.meta.url));
const browserDistFolder: string = resolve(serverDistFolder, '../browser');

const options: AngularNodeAppEngineOptions = {
  allowedHosts: ['localhost'],
  trustProxyHeaders: ['forwarded"'],
};
const angularApp = new AngularNodeAppEngine(options);
const app: Express = express();

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
