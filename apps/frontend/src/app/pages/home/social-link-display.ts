import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin, faMastodon, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faGlobe, faLink } from '@fortawesome/free-solid-svg-icons';
import type { PublicSocialLink } from './public-social-link.model';

const PLATFORM_ICONS: Readonly<Record<string, IconDefinition>> = {
  github: faGithub,
  linkedin: faLinkedin,
  x: faXTwitter,
  twitter: faXTwitter,
  mastodon: faMastodon,
  email: faEnvelope,
  website: faGlobe,
};

const PLATFORM_LABELS: Readonly<Record<string, string>> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  x: 'X',
  twitter: 'X',
  mastodon: 'Mastodon',
  email: 'Email',
  website: 'Website',
};

export function socialLinkIcon(platform: string): IconDefinition {
  return PLATFORM_ICONS[platform.toLowerCase()] ?? faLink;
}

export function socialLinkLabel(link: PublicSocialLink): string {
  return link.label ?? PLATFORM_LABELS[link.platform.toLowerCase()] ?? link.platform;
}

export function socialLinkHref(link: PublicSocialLink): string {
  const isEmail = link.platform.toLowerCase() === 'email';

  return isEmail && !link.url.toLowerCase().startsWith('mailto:') ? `mailto:${link.url}` : link.url;
}

export function socialLinkTarget(link: PublicSocialLink): '_blank' | null {
  return link.platform.toLowerCase() === 'email' ? null : '_blank';
}

export function socialLinkEmailAddress(link: PublicSocialLink): string {
  return link.url.replace(/^mailto:/i, '');
}
