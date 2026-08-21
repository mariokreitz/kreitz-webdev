import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { type NextFunction, type Request, type Response } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['http://localhost:4201/'],
});

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
  const port = Number(process.env['PORTAL_PORT']) || 4201;
  app.listen(port, () => {
    console.warn(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
