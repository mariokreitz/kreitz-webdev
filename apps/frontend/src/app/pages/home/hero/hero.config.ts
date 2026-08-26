import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faAngular,
  faApple,
  faClaude,
  faCopilot,
  faDocker,
  faJs,
  faNodeJs,
  faPostgresql,
  faSass,
  faTailwindCss,
  faTypescript,
} from '@fortawesome/free-brands-svg-icons';
import { BRAND_ICONS, type BrandIconData } from '@shared/ui';

import type { ConstellationConfig, Skill, SkillIcon } from './constellation-background/constellation-background.types';

const CATEGORY_ACCENTS = {
  frontend: '--color-primary',
  backend: '--color-secondary',
  ai: '--color-tertiary',
  testing: '--color-warning',
  tooling: '--color-info',
} as const;

function fontAwesomeIcon(icon: IconDefinition): SkillIcon {
  return { kind: 'fontawesome', icon };
}

function brandIcon(data: BrandIconData): SkillIcon {
  return { kind: 'brand', path: data.path, viewBox: data.viewBox };
}

function buildSkills(accentVariable: string, entries: readonly { name: string; icon: SkillIcon }[]): Skill[] {
  return entries.map((entry) => ({ ...entry, accentVariable }));
}

const HERO_SKILLS: readonly Skill[] = [
  ...buildSkills(CATEGORY_ACCENTS.frontend, [
    { name: 'Angular', icon: fontAwesomeIcon(faAngular) },
    { name: 'TypeScript', icon: fontAwesomeIcon(faTypescript) },
    { name: 'JavaScript', icon: fontAwesomeIcon(faJs) },
    { name: 'RxJS', icon: brandIcon(BRAND_ICONS.rxjs) },
    { name: 'Sass', icon: fontAwesomeIcon(faSass) },
    { name: 'Tailwind CSS', icon: fontAwesomeIcon(faTailwindCss) },
  ]),
  ...buildSkills(CATEGORY_ACCENTS.backend, [
    { name: 'Node.js', icon: fontAwesomeIcon(faNodeJs) },
    { name: 'NestJS', icon: brandIcon(BRAND_ICONS.nestjs) },
    { name: 'Express', icon: brandIcon(BRAND_ICONS.express) },
    { name: 'Prisma', icon: brandIcon(BRAND_ICONS.prisma) },
    { name: 'PostgreSQL', icon: fontAwesomeIcon(faPostgresql) },
    { name: 'Redis', icon: brandIcon(BRAND_ICONS.redis) },
    { name: 'Zod', icon: brandIcon(BRAND_ICONS.zod) },
    { name: 'Better Auth', icon: brandIcon(BRAND_ICONS.betterAuth) },
  ]),
  ...buildSkills(CATEGORY_ACCENTS.ai, [
    { name: 'Claude', icon: fontAwesomeIcon(faClaude) },
    { name: 'Claude Code', icon: brandIcon(BRAND_ICONS.claudeCode) },
    { name: 'GitHub Copilot', icon: fontAwesomeIcon(faCopilot) },
    { name: 'LM Studio', icon: brandIcon(BRAND_ICONS.lmStudio) },
  ]),
  ...buildSkills(CATEGORY_ACCENTS.testing, [
    { name: 'Jest', icon: brandIcon(BRAND_ICONS.jest) },
    { name: 'Cypress', icon: brandIcon(BRAND_ICONS.cypress) },
    { name: 'Playwright', icon: brandIcon(BRAND_ICONS.playwright) },
    { name: 'Postman', icon: brandIcon(BRAND_ICONS.postman) },
    { name: 'ESLint', icon: brandIcon(BRAND_ICONS.eslint) },
  ]),
  ...buildSkills(CATEGORY_ACCENTS.tooling, [
    { name: 'Docker', icon: fontAwesomeIcon(faDocker) },
    { name: 'Nginx', icon: brandIcon(BRAND_ICONS.nginx) },
    { name: 'Nx', icon: brandIcon(BRAND_ICONS.nx) },
    { name: 'WebStorm', icon: brandIcon(BRAND_ICONS.webstorm) },
    { name: 'Rider', icon: brandIcon(BRAND_ICONS.rider) },
    { name: 'Apple/macOS', icon: fontAwesomeIcon(faApple) },
  ]),
];

export const heroConstellationConfig: ConstellationConfig = {
  skills: HERO_SKILLS,
  linkDistance: 120,
  lineOpacity: 0.55,
  lineWidth: 1,
  baseSpeed: 0.15,
  maxSpeed: 0.6,
  damping: 0.95,
  mouse: {
    enabled: false,
    radius: 140,
    force: 0.6,
  },
  textExclusionZone: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    force: 0.9,
    margin: 72,
  },
  navExclusionZone: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    force: 0.9,
    margin: 48,
  },
};
