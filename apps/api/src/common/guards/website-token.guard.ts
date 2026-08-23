import { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';
import { WEBSITE_DOMAIN_REPOSITORY } from '@app/modules/website-domain/tokens/website-domain.tokens';
import { WEBSITE_TOKEN_REPOSITORY } from '@app/modules/website-token/tokens/website-token.tokens';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'node:crypto';

@Injectable()
export class WebsiteTokenGuard implements CanActivate {
  constructor(
    @Inject(WEBSITE_TOKEN_REPOSITORY)
    private readonly websiteTokenRepository: IWebsiteTokenRepository,

    @Inject(WEBSITE_DOMAIN_REPOSITORY)
    private readonly websiteDomainRepository: IWebsiteDomainRepository,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const rawToken = this.extractToken(request);

    if (!rawToken) {
      throw new UnauthorizedException('Missing website token');
    }

    const tokenHash = this.hashToken(rawToken);

    const token = await this.websiteTokenRepository.findByTokenHash(tokenHash);

    if (!token) {
      throw new UnauthorizedException('Invalid website token');
    }

    if (!token.active) {
      throw new UnauthorizedException('Website token is inactive');
    }

    if (token.revokedAt) {
      throw new UnauthorizedException('Website token has been revoked');
    }

    if (token.expiresAt && token.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Website token has expired');
    }

    await this.validateOrigin(request, token.websiteId);

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

  private async validateOrigin(request: Request, websiteId: string): Promise<void> {
    const origin = request.headers.origin;

    if (!origin) {
      throw new UnauthorizedException('Missing request origin');
    }

    let hostname: string;

    try {
      const parsedOrigin = new URL(origin);

      if (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }

      hostname = parsedOrigin.hostname.toLowerCase().replace(/\.$/, '');
    } catch {
      throw new UnauthorizedException('Invalid request origin');
    }

    const domain = await this.websiteDomainRepository.findVerifiedByDomain(hostname);

    if (!domain) {
      throw new UnauthorizedException('Unverified request origin');
    }

    if (domain.websiteId !== websiteId) {
      throw new UnauthorizedException('Request origin is not authorized');
    }
  }
}
