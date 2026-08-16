export {};

declare global {
  namespace Express {
    interface Request {
      // Korrelations-ID pro Request, gesetzt von der RequestIdMiddleware.
      id: string;
    }
  }
}
