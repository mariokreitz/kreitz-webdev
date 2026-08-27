import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  REQUEST_CONTEXT,
  TransferState,
  computed,
  inject,
  makeStateKey,
  type Signal,
  type StateKey,
} from '@angular/core';

import { SeoService } from '../../core/seo';
import { asHomeRequestContext } from '../../core/ssr';
import { ThemeService, type Theme } from '../../core/theme';
import { CompaniesSection } from './companies/companies-section.component';
import { ContactSection } from './contact-section/contact-section.component';
import { Hero } from './hero/hero.component';
import { heroConstellationConfig } from './hero/hero.config';
import { ProjectsSection } from './projects/projects-section.component';
import type { PublicCompany } from './public-company.model';
import type { PublicProject } from './public-project.model';

const PROJECTS_STATE_KEY: StateKey<readonly PublicProject[]> =
  makeStateKey<readonly PublicProject[]>('public-projects');
const COMPANIES_STATE_KEY: StateKey<readonly PublicCompany[]> =
  makeStateKey<readonly PublicCompany[]>('public-companies');

@Component({
  selector: 'kwd-frontend-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, CompaniesSection, ProjectsSection, ContactSection],
  templateUrl: './home.component.html',
})
export class Home {
  protected readonly heroConstellationConfig = heroConstellationConfig;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly requestContext = asHomeRequestContext(inject(REQUEST_CONTEXT, { optional: true }));
  private readonly seoService: SeoService = inject(SeoService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly themeService: ThemeService = inject(ThemeService);

  protected readonly projects: readonly PublicProject[];
  protected readonly companies: readonly PublicCompany[];
  protected readonly theme: Signal<Theme> = computed(() => this.themeService.theme());

  constructor() {
    this.projects = this.resolveProjects();
    this.companies = this.resolveCompanies();

    this.seoService.applyRouteMeta(
      { titleKey: 'seo.home.title', descriptionKey: 'seo.home.description', path: '' },
      this.destroyRef,
    );
    this.seoService.applyPersonSchema(this.destroyRef);
  }

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
}
