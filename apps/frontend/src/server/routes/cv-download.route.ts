import type { Express, Request, Response } from 'express';

import { fetchCvFile } from '../fetch-cv-file';

export function registerCvDownloadRoute(app: Express, apiBaseUrl: string): void {
  app.get('/api/cv/download', (_req: Request, res: Response) => {
    void handleCvDownload(apiBaseUrl, res);
  });
}

async function handleCvDownload(apiBaseUrl: string, res: Response): Promise<void> {
  const result = await fetchCvFile(apiBaseUrl);

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
