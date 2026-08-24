import type { UserSession } from '@thallesp/nestjs-better-auth';

export {};

declare global {
  namespace Express {
    interface Request {
      id: string;
      websiteId?: string;
      websiteTokenId?: string;
      skipResponseEnvelope?: boolean;
      session?: UserSession | null;
    }
  }
}
