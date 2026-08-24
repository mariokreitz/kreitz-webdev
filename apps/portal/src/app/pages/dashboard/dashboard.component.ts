import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { Card, Skeleton } from '@shared/ui';
import { environment } from '@shared/environments';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, Project, Website } from '../../core/api';
import { CurrentUserStore } from '../../core/user';

interface MetricCard {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly loading: boolean;
  readonly error: boolean;
}

interface ActivityEntry {
  readonly id: string;
  readonly label: string;
  readonly timestamp: string;
}

@Component({
  selector: 'kwd-portal-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Skeleton, TranslatePipe],
  templateUrl: './dashboard.component.html',
})
export default class Dashboard {
  private readonly currentUserStore: CurrentUserStore = inject(CurrentUserStore);
  private readonly translate: TranslateService = inject(TranslateService);

  private readonly projectsResource = httpResource<readonly Project[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/projects`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly Project[]>).data, defaultValue: [] },
  );

  private readonly websitesResource = httpResource<readonly Website[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly Website[]>).data, defaultValue: [] },
  );

  public readonly greetingName: Signal<string> = computed(() => this.currentUserStore.profile()?.name ?? 'there');

  public readonly isActivityLoading: Signal<boolean> = computed(() => this.projectsResource.isLoading());

  public readonly isActivityError: Signal<boolean> = computed(() => this.projectsResource.error() !== undefined);

  public readonly metrics: Signal<readonly MetricCard[]> = computed(() => {
    const projectsLoading = this.projectsResource.isLoading();
    const projectsError = this.projectsResource.error() !== undefined;
    const websitesLoading = this.websitesResource.isLoading();
    const websitesError = this.websitesResource.error() !== undefined;
    const projectCount = this.projectsResource.value().length;
    const websiteCount = this.websitesResource.value().filter((website) => website.enabled).length;
    const previousLoginAt = this.currentUserStore.previousLoginAt();

    return [
      {
        label: 'dashboard.metrics.activeProjects.label',
        value: String(projectCount),
        hint:
          projectCount === 0 ? 'dashboard.metrics.activeProjects.hintEmpty' : 'dashboard.metrics.activeProjects.hint',
        loading: projectsLoading,
        error: projectsError,
      },
      {
        label: 'dashboard.metrics.activeWebsites.label',
        value: String(websiteCount),
        hint:
          websiteCount === 0 ? 'dashboard.metrics.activeWebsites.hintEmpty' : 'dashboard.metrics.activeWebsites.hint',
        loading: websitesLoading,
        error: websitesError,
      },
      {
        label: 'dashboard.metrics.activeDomains.label',
        value: '—',
        hint: 'dashboard.metrics.activeDomains.hint',
        loading: false,
        error: false,
      },
      {
        label: 'dashboard.metrics.lastLogin.label',
        value: previousLoginAt?.toLocaleString() ?? this.translate.instant('dashboard.metrics.lastLogin.firstLogin'),
        hint: 'dashboard.metrics.lastLogin.hint',
        loading: false,
        error: false,
      },
      {
        label: 'dashboard.metrics.systemAlerts.label',
        value: '0',
        hint: 'dashboard.metrics.systemAlerts.hint',
        loading: false,
        error: false,
      },
    ];
  });

  public readonly activity: Signal<readonly ActivityEntry[]> = computed(() =>
    [...this.projectsResource.value()]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((project) => ({
        id: project.id,
        label: project.name,
        timestamp: new Date(project.updatedAt).toLocaleDateString(),
      })),
  );
}
