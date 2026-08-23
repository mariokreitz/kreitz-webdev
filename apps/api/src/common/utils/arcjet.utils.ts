import type { ArcjetDecision, ArcjetNestRequest } from '@arcjet/nest';
import type { Request } from 'express';
import type { PinoLogger } from 'nestjs-pino';

export type ArcjetRuleMode = 'LIVE' | 'DRY_RUN';

export function toArcjetRequest(req: Request): ArcjetNestRequest {
  return req as ArcjetNestRequest;
}

export function toErrorReason(error: unknown): string {
  return error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown error';
}

export function logErroredArcjetDecision(logger: PinoLogger, decision: ArcjetDecision): void {
  if (decision.isErrored()) {
    logger.info({ event: 'arcjet.decision.errored', reason: decision.reason.message });
  }
}
