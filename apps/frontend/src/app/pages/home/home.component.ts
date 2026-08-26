import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  REQUEST_CONTEXT,
  TransferState,
  inject,
  makeStateKey,
  signal,
  type Signal,
  type StateKey,
} from '@angular/core';
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

import { SeoService } from '../../core/seo';
import { CompaniesSection } from './companies/companies-section.component';
import { Contact } from './contact/contact.component';
import { ContactSection } from './contact-section/contact-section.component';
import { CvDownload } from './cv/cv-download.component';
import type {
  ConstellationConfig,
  Skill,
  SkillIcon,
} from './hero/constellation-background/constellation-background.types';
import { Hero } from './hero/hero.component';
import { ProjectsSection } from './projects/projects-section.component';
import type { PublicCompany } from './public-company.model';
import { asHomeRequestContext, type PublicProject } from './public-project.model';

const PROJECTS_STATE_KEY: StateKey<readonly PublicProject[]> =
  makeStateKey<readonly PublicProject[]>('public-projects');
const COMPANIES_STATE_KEY: StateKey<readonly PublicCompany[]> =
  makeStateKey<readonly PublicCompany[]>('public-companies');
const CV_AVAILABLE_STATE_KEY: StateKey<boolean> = makeStateKey<boolean>('cv-available');

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

@Component({
  selector: 'kwd-frontend-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Contact, Hero, ProjectsSection, CompaniesSection, ContactSection, CvDownload],
  templateUrl: './home.component.html',
})
export class Home {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly requestContext = asHomeRequestContext(inject(REQUEST_CONTEXT, { optional: true }));
  private readonly seoService: SeoService = inject(SeoService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  protected readonly projects: Signal<readonly PublicProject[]> = signal(this.resolveProjects());
  protected readonly companies: Signal<readonly PublicCompany[]> = signal(this.resolveCompanies());
  protected readonly cvAvailable: Signal<boolean> = signal(this.resolveCvAvailable());

  constructor() {
    this.seoService.applyRouteMeta(
      { titleKey: 'seo.home.title', descriptionKey: 'seo.home.description', path: '' },
      this.destroyRef,
    );
  }

  protected readonly heroConstellationConfig: ConstellationConfig = {
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

  private resolveProjects(): readonly PublicProject[] {
    if (isPlatformServer(this.platformId)) {
      const projects = this.requestContext?.projects ?? [];
      this.transferState.set(PROJECTS_STATE_KEY, projects);
      return projects;
    }

    return this.transferState.get(PROJECTS_STATE_KEY, []);
  }

  private resolveCompanies(): readonly PublicCompany[] {
    if (isPlatformServer(this.platformId)) {
      const companies = this.requestContext?.companies ?? [];
      this.transferState.set(COMPANIES_STATE_KEY, companies);
      return companies;
    }

    return this.transferState.get(COMPANIES_STATE_KEY, []);
  }

  private resolveCvAvailable(): boolean {
    if (isPlatformServer(this.platformId)) {
      const cvAvailable = this.requestContext?.cvAvailable ?? false;
      this.transferState.set(CV_AVAILABLE_STATE_KEY, cvAvailable);
      return cvAvailable;
    }

    return this.transferState.get(CV_AVAILABLE_STATE_KEY, false);
  }
}
