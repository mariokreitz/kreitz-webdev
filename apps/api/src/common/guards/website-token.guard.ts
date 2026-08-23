import { RedisConfig, redisConfig } from '@app/config/redis.config';
import { WEBSITE_TOKEN_LAST_USED_DEBOUNCE_MS } from '@app/common/constants/website-token-guard.constants';
import { CacheService } from '@app/database/cache';
import { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';
import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import { WEBSITE_DOMAIN_REPOSITORY, normalizeDomain } from '@app/modules/website-domain';
import { WEBSITE_TOKEN_REPOSITORY, buildWebsiteTokenCacheKey, hashWebsiteToken } from '@app/modules/website-token';
import { WEBSITE_REPOSITORY } from '@app/modules/website';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class WebsiteTokenGuard implements CanActivate {
  constructor(
    @Inject(WEBSITE_TOKEN_REPOSITORY)
    private readonly websiteTokenRepository: IWebsiteTokenRepository,

    @Inject(WEBSITE_DOMAIN_REPOSITORY)
    private readonly websiteDomainRepository: IWebsiteDomainRepository,

    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,

    @Inject(redisConfig.KEY)
    private readonly redis: RedisConfig,

    private readonly cacheService: CacheService,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebsiteTokenGuard.name);
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const rawToken = this.extractToken(request);

    if (!rawToken) {
      this.logger.warn({ event: 'website_token.guard.rejected', reason: 'missing_token', ip: request.ip });

      throw new UnauthorizedException('Missing website token');
    }

    const tokenHash = hashWebsiteToken(rawToken);

    const token = await this.cacheService.getOrSet<WebsiteTokenRecord | null>(
      buildWebsiteTokenCacheKey(tokenHash),
      this.redis.ttlMs,
      async () => this.websiteTokenRepository.findByTokenHash(tokenHash),
    );

    if (!token) {
      this.logger.warn({ event: 'website_token.guard.rejected', reason: 'invalid_token', ip: request.ip });

      throw new UnauthorizedException('Invalid website token');
    }

    // WHY: a token round-tripped through the Redis (L2) cache layer is JSON-serialized, so Date fields come back as ISO strings; normalizing here keeps this correct whether the record is fresh from Prisma or served from either cache tier.
    const expiresAt = token.expiresAt ? new Date(token.expiresAt) : null;

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      this.logger.warn({
        event: 'website_token.guard.rejected',
        reason: 'expired_token',
        websiteId: token.websiteId,
        tokenId: token.id,
      });

      throw new UnauthorizedException('Website token has expired');
    }

    const website = await this.cacheService.getOrSet<WebsiteRecord | null>(
      `website:${token.websiteId}`,
      this.redis.ttlMs,
      async () => this.websiteRepository.findById(token.websiteId),
    );

    if (!website) {
      this.logger.warn({
        event: 'website_token.guard.rejected',
        reason: 'website_not_found',
        websiteId: token.websiteId,
        tokenId: token.id,
      });

      throw new UnauthorizedException('Invalid website token');
    }

    if (!website.enabled) {
      this.logger.warn({
        event: 'website_token.guard.rejected',
        reason: 'website_disabled',
        websiteId: website.id,
        tokenId: token.id,
      });

      throw new ForbiddenException('Website is disabled');
    }

    await this.validateOrigin(request, token.websiteId, token.id);

    request.websiteId = token.websiteId;
    request.websiteTokenId = token.id;

    const lastUsedAt = token.lastUsedAt ? new Date(token.lastUsedAt) : null;
    const isLastUsedStale = !lastUsedAt || Date.now() - lastUsedAt.getTime() >= WEBSITE_TOKEN_LAST_USED_DEBOUNCE_MS;

    if (isLastUsedStale) {
      const usedAt = new Date();

      await this.websiteTokenRepository.updateLastUsedAt(token.id, usedAt);

      // WHY: without refreshing the cached record, every subsequent request within the ttl would keep reading the stale lastUsedAt and re-triggering the write, defeating the debounce.
      await this.cacheService.set(
        buildWebsiteTokenCacheKey(tokenHash),
        { ...token, lastUsedAt: usedAt },
        this.redis.ttlMs,
      );
    }

    return true;
  }

  private extractToken(request: Request): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const parts = authorization.trim().split(/\s+/);

    if (parts.length !== 2) {
      return null;
    }

    const scheme = parts[0];
    const token = parts[1];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }

  private async validateOrigin(request: Request, websiteId: string, tokenId: string): Promise<void> {
    const origin = request.headers.origin;

    if (!origin) {
      return;
    }

    let hostname: string;

    try {
      const parsedOrigin = new URL(origin);

      if (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }

      const normalized = normalizeDomain(parsedOrigin.hostname);

      // normalizeDomain returns unknown to double as a class-transformer callback; a string in always yields a string out.
      hostname = typeof normalized === 'string' ? normalized : parsedOrigin.hostname.toLowerCase();
    } catch {
      this.logger.warn({ event: 'website_token.guard.rejected', reason: 'origin_invalid', websiteId, tokenId });

      throw new ForbiddenException('Invalid request origin');
    }

    const domain = await this.websiteDomainRepository.findVerifiedByDomain(hostname);

    if (!domain) {
      this.logger.warn({ event: 'website_token.guard.rejected', reason: 'origin_unverified', websiteId, tokenId });

      throw new ForbiddenException('Unverified request origin');
    }

    if (domain.websiteId !== websiteId) {
      this.logger.warn({ event: 'website_token.guard.rejected', reason: 'origin_mismatch', websiteId, tokenId });

      throw new ForbiddenException('Request origin is not authorized');
    }
  }
}
