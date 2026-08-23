export {};

declare global {
  namespace Express {
    interface Request {
      id: string;
      websiteId?: string;
      websiteTokenId?: string;
    }
  }
}
