import { type AppConfig, appConfig } from '@app/config';
import { ARCJET, type ArcjetDecision, type ArcjetNest, type ArcjetNestRequest, tokenBucket } from '@arcjet/nest';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';

type ArcjetRuleMode = 'LIVE' | 'DRY_RUN';

function toArcjetRequest(req: Request): ArcjetNestRequest {
  return req as unknown as ArcjetNestRequest;
}

@Injectable()
export class ArcjetRateLimitGuard implements CanActivate {
  private readonly websiteBucket: ArcjetNest;
  private readonly ipFallbackBucket: ArcjetNest;

  constructor(
    @Inject(ARCJET) private readonly arcjet: ArcjetNest,
    @Inject(appConfig.KEY) app: AppConfig,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ArcjetRateLimitGuard.name);

    const mode: ArcjetRuleMode = app.env === 'development' ? 'DRY_RUN' : 'LIVE';

    this.websiteBucket = this.arcjet.withRule(
      tokenBucket({ mode, characteristics: ['websiteId'], refillRate: 60, interval: 60, capacity: 100 }),
    );

    this.ipFallbackBucket = this.arcjet.withRule(tokenBucket({ mode, refillRate: 20, interval: 60, capacity: 20 }));
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const websiteId = request.websiteId;

    let decision: ArcjetDecision;

    try {
      const arcjetRequest = toArcjetRequest(request);
      decision = websiteId
        ? await this.websiteBucket.protect(arcjetRequest, { requested: 1, websiteId })
        : await this.ipFallbackBucket.protect(arcjetRequest, { requested: 1 });
    } catch (error) {
      this.logger.error('Arcjet rate limit guard failed; failing open', error as Error);
      return true;
    }

    return this.handleDecision(decision, websiteId);
  }

  private handleDecision(decision: ArcjetDecision, websiteId: string | undefined): boolean {
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        this.logger.warn({
          event: 'arcjet.rate_limit.denied',
          bucket: websiteId ? 'website' : 'ip_fallback',
          websiteId,
        });

        throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      throw new ForbiddenException('Request blocked');
    }

    if (decision.isErrored()) {
      this.logger.info(`Arcjet decision errored: ${decision.reason.message}`);
    }

    return true;
  }
}
