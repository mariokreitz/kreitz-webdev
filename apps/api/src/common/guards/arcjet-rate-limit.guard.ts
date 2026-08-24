import {
  logErroredArcjetDecision,
  toArcjetRequest,
  toErrorReason,
  type ArcjetRuleMode,
} from '@app/common/utils/arcjet.utils';
import { type AppConfig, appConfig } from '@app/config';
import { ARCJET, type ArcjetDecision, type ArcjetNest, tokenBucket } from '@arcjet/nest';
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

@Injectable()
export class ArcjetRateLimitGuard implements CanActivate {
  private readonly websiteBucket: ArcjetNest;
  private readonly userBucket: ArcjetNest;
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

    this.userBucket = this.arcjet.withRule(
      tokenBucket({ mode, characteristics: ['userId'], refillRate: 120, interval: 60, capacity: 120 }),
    );

    this.ipFallbackBucket = this.arcjet.withRule(tokenBucket({ mode, refillRate: 20, interval: 60, capacity: 20 }));
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const websiteId = request.websiteId;
    const userId = request.session?.user.id;

    let decision: ArcjetDecision;

    try {
      const arcjetRequest = toArcjetRequest(request);
      decision = websiteId
        ? await this.websiteBucket.protect(arcjetRequest, { requested: 1, websiteId })
        : userId
          ? await this.userBucket.protect(arcjetRequest, { requested: 1, userId })
          : await this.ipFallbackBucket.protect(arcjetRequest, { requested: 1 });
    } catch (error) {
      this.logger.error({ event: 'arcjet.rate_limit.failed_open', reason: toErrorReason(error) });
      return true;
    }

    return this.handleDecision(decision, websiteId, userId);
  }

  private handleDecision(decision: ArcjetDecision, websiteId: string | undefined, userId: string | undefined): boolean {
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        this.logger.warn({
          event: 'arcjet.rate_limit.denied',
          bucket: websiteId ? 'website' : userId ? 'user' : 'ip_fallback',
          websiteId,
          userId,
        });

        throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      throw new ForbiddenException('Request blocked');
    }

    logErroredArcjetDecision(this.logger, decision);

    return true;
  }
}
