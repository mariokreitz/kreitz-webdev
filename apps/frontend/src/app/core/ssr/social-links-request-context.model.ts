import { isPublicSocialLink, type PublicSocialLink } from '../../pages/home/public-social-link.model';

export interface SocialLinksRequestContext {
  readonly socialLinks: readonly PublicSocialLink[];
}

export function asSocialLinksRequestContext(value: unknown): SocialLinksRequestContext | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }

  const { socialLinks } = value as Record<string, unknown>;

  if (Array.isArray(socialLinks) && socialLinks.every(isPublicSocialLink)) {
    return { socialLinks };
  }

  return null;
}
