import { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';
import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { WEBSITE_DOMAIN_REPOSITORY } from '@app/modules/website-domain/tokens/website-domain.tokens';
import { WEBSITE_TOKEN_REPOSITORY } from '@app/modules/website-token/tokens/website-token.tokens';
import { WEBSITE_REPOSITORY } from '@app/modules/website/tokens/website.tokens';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'node:crypto';
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

    const tokenHash = this.hashToken(rawToken);

    const token = await this.websiteTokenRepository.findByTokenHash(tokenHash);

    if (!token) {
      this.logger.warn({ event: 'website_token.guard.rejected', reason: 'invalid_token', ip: request.ip });

      throw new UnauthorizedException('Invalid website token');
    }

    if (token.expiresAt && token.expiresAt.getTime() <= Date.now()) {
      this.logger.warn({
        event: 'website_token.guard.rejected',
        reason: 'expired_token',
        websiteId: token.websiteId,
        tokenId: token.id,
      });

      throw new UnauthorizedException('Website token has expired');
    }

    const website = await this.websiteRepository.findById(token.websiteId);

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

    await this.websiteTokenRepository.updateLastUsedAt(token.id, new Date());

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

  private hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
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

      hostname = parsedOrigin.hostname.toLowerCase().replace(/\.$/, '');
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
