import {
  ARCJET,
  type ArcjetDecision,
  type ArcjetNest,
  type ArcjetNestRequest,
  detectBot,
  tokenBucket,
  validateEmail,
} from '@arcjet/nest';
import { Inject, Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import express, { type NextFunction, type Request, type Response } from 'express';

const AUTH_BASE_PATH = '/api/auth';
const SIGN_UP_EMAIL_PATH = '/api/auth/sign-up/email';
const SIGN_IN_EMAIL_PATH = '/api/auth/sign-in/email';

const JSON_BODY_LIMIT = '20kb';

const jsonBodyParser = express.json({ limit: JSON_BODY_LIMIT });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toArcjetRequest(req: Request): ArcjetNestRequest {
  return req as unknown as ArcjetNestRequest;
}

@Injectable()
export class ArcjetAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ArcjetAuthMiddleware.name);

  private readonly signUpBase: ArcjetNest;
  private readonly signUpWithEmail: ArcjetNest;
  private readonly signIn: ArcjetNest;

  constructor(@Inject(ARCJET) private readonly arcjet: ArcjetNest) {
    this.signUpBase = this.arcjet
      .withRule(detectBot({ mode: 'DRY_RUN', allow: [] }))
      .withRule(tokenBucket({ mode: 'DRY_RUN', refillRate: 5, interval: 60, capacity: 5 }));

    this.signUpWithEmail = this.signUpBase.withRule(
      validateEmail({ mode: 'DRY_RUN', deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'] }),
    );

    this.signIn = this.arcjet
      .withRule(detectBot({ mode: 'DRY_RUN', allow: [] }))
      .withRule(tokenBucket({ mode: 'DRY_RUN', refillRate: 10, interval: 60, capacity: 10 }));
  }

  public async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.path.startsWith(AUTH_BASE_PATH)) {
      next();
      return;
    }

    try {
      if (req.path === SIGN_UP_EMAIL_PATH) {
        await this.protectSignUp(req, res, next);
        return;
      }

      if (req.path === SIGN_IN_EMAIL_PATH) {
        await this.protectSignIn(req, res, next);
        return;
      }

      const decision = await this.arcjet.protect(toArcjetRequest(req));
      this.handleDecision(decision, res, next);
    } catch (error) {
      this.logger.error('Arcjet auth middleware failed; failing open', error as Error);
      next();
    }
  }

  private async protectSignUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const email = await this.tryReadJsonEmail(req, res);
    const arcjetReq = toArcjetRequest(req);
    const decision = email
      ? await this.signUpWithEmail.protect(arcjetReq, { requested: 1, email })
      : await this.signUpBase.protect(arcjetReq, { requested: 1 });

    this.handleDecision(decision, res, next);
  }

  private async protectSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    const decision = await this.signIn.protect(toArcjetRequest(req), { requested: 1 });

    this.handleDecision(decision, res, next);
  }

  private handleDecision(decision: ArcjetDecision, res: Response, next: NextFunction): void {
    if (decision.isDenied()) {
      const status = decision.reason.isRateLimit() ? 429 : 403;
      res.status(status).json({ message: 'Request blocked' });
      return;
    }

    if (decision.isErrored()) {
      this.logger.warn(`Arcjet decision errored: ${decision.reason.message}`);
    }

    next();
  }

  private async tryReadJsonEmail(req: Request, res: Response): Promise<string | undefined> {
    const contentType = req.headers['content-type'];

    if (typeof contentType !== 'string' || !contentType.includes('application/json')) {
      return undefined;
    }

    await new Promise<void>((resolve) => {
      jsonBodyParser(req, res, (error?: unknown) => {
        if (error instanceof Error) {
          this.logger.debug(`Skipping Arcjet email validation: failed to pre-parse body (${error.message})`);
        } else if (error) {
          this.logger.debug('Skipping Arcjet email validation: failed to pre-parse body');
        }
        resolve();
      });
    });

    const body: unknown = (req as Request & { body?: unknown }).body;

    return isRecord(body) && typeof body['email'] === 'string' ? body['email'] : undefined;
  }
}
