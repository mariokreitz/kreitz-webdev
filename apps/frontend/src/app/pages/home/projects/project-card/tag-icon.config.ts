import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faAngular,
  faCss3Alt,
  faDocker,
  faGitAlt,
  faGithub,
  faHtml5,
  faJs,
  faNodeJs,
  faPostgresql,
  faPython,
  faReact,
  faSass,
  faTailwindCss,
  faTypescript,
  faVuejs,
} from '@fortawesome/free-brands-svg-icons';
import { faTag } from '@fortawesome/free-solid-svg-icons';
import { BRAND_ICONS, type BrandIconData } from '@shared/ui';

import type { TagIcon } from './project-card.types';

function fontAwesomeIcon(icon: IconDefinition): TagIcon {
  return { kind: 'fontawesome', icon };
}

function brandIcon(data: BrandIconData): TagIcon {
  return { kind: 'brand', path: data.path, viewBox: data.viewBox };
}

const TAG_ICON_ALIASES: Readonly<Record<string, TagIcon>> = {
  angular: fontAwesomeIcon(faAngular),
  typescript: fontAwesomeIcon(faTypescript),
  ts: fontAwesomeIcon(faTypescript),
  javascript: fontAwesomeIcon(faJs),
  js: fontAwesomeIcon(faJs),
  rxjs: brandIcon(BRAND_ICONS.rxjs),
  sass: fontAwesomeIcon(faSass),
  scss: fontAwesomeIcon(faSass),
  tailwind: fontAwesomeIcon(faTailwindCss),
  tailwindcss: fontAwesomeIcon(faTailwindCss),
  nodejs: fontAwesomeIcon(faNodeJs),
  node: fontAwesomeIcon(faNodeJs),
  nestjs: brandIcon(BRAND_ICONS.nestjs),
  nest: brandIcon(BRAND_ICONS.nestjs),
  express: brandIcon(BRAND_ICONS.express),
  expressjs: brandIcon(BRAND_ICONS.express),
  prisma: brandIcon(BRAND_ICONS.prisma),
  postgresql: fontAwesomeIcon(faPostgresql),
  postgres: fontAwesomeIcon(faPostgresql),
  psql: fontAwesomeIcon(faPostgresql),
  redis: brandIcon(BRAND_ICONS.redis),
  zod: brandIcon(BRAND_ICONS.zod),
  betterauth: brandIcon(BRAND_ICONS.betterAuth),
  docker: fontAwesomeIcon(faDocker),
  nginx: brandIcon(BRAND_ICONS.nginx),
  nx: brandIcon(BRAND_ICONS.nx),
  html: fontAwesomeIcon(faHtml5),
  html5: fontAwesomeIcon(faHtml5),
  css: fontAwesomeIcon(faCss3Alt),
  css3: fontAwesomeIcon(faCss3Alt),
  react: fontAwesomeIcon(faReact),
  reactjs: fontAwesomeIcon(faReact),
  vue: fontAwesomeIcon(faVuejs),
  vuejs: fontAwesomeIcon(faVuejs),
  git: fontAwesomeIcon(faGitAlt),
  github: fontAwesomeIcon(faGithub),
  python: fontAwesomeIcon(faPython),
  jest: brandIcon(BRAND_ICONS.jest),
  cypress: brandIcon(BRAND_ICONS.cypress),
  playwright: brandIcon(BRAND_ICONS.playwright),
  eslint: brandIcon(BRAND_ICONS.eslint),
};

const FALLBACK_TAG_ICON: TagIcon = fontAwesomeIcon(faTag);

function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolveTagIcon(tag: string): TagIcon {
  return TAG_ICON_ALIASES[normalizeTag(tag)] ?? FALLBACK_TAG_ICON;
}
