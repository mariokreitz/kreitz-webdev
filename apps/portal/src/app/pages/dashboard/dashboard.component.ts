import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { Card, Skeleton } from '@shared/ui';
import { environment } from '@shared/environments';
import { TranslatePipe } from '@ngx-translate/core';
import type { ApiEnvelope, DomainsSummary, Project, Website } from '../../core/api';
import { CurrentUserStore } from '../../core/user';
import { ActivityFeed, type ActivityEntry } from './activity-feed/activity-feed.component';
import { MetricsGrid, type MetricCard } from './metrics-grid/metrics-grid.component';

@Component({
  selector: 'kwd-portal-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Skeleton, MetricsGrid, ActivityFeed, TranslatePipe],
  templateUrl: './dashboard.component.html',
})
export default class Dashboard {
  private readonly currentUserStore: CurrentUserStore = inject(CurrentUserStore);

  private readonly projectsResource = httpResource<readonly Project[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/projects`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly Project[]>).data, defaultValue: [] },
  );

  private readonly websitesResource = httpResource<readonly Website[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly Website[]>).data, defaultValue: [] },
  );

  private readonly domainsSummaryResource = httpResource<DomainsSummary | null>(
    () => ({ url: `${environment.api.kreitzWebdev}/dashboard/domains-summary`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<DomainsSummary>).data, defaultValue: null },
  );

  public readonly greetingName: Signal<string> = computed(() => this.currentUserStore.profile()?.name ?? 'there');

  public readonly isActivityLoading: Signal<boolean> = computed(
    () => this.projectsResource.isLoading() || this.websitesResource.isLoading(),
  );

  public readonly isActivityError: Signal<boolean> = computed(
    () => this.projectsResource.error() !== undefined || this.websitesResource.error() !== undefined,
  );

  public readonly metrics: Signal<readonly MetricCard[]> = computed(() => {
    const projectsLoading = this.projectsResource.isLoading();
    const projectsError = this.projectsResource.error() !== undefined;
    const websitesLoading = this.websitesResource.isLoading();
    const websitesError = this.websitesResource.error() !== undefined;
    const domainsLoading = this.domainsSummaryResource.isLoading();
    const domainsError = this.domainsSummaryResource.error() !== undefined;

    const projectCount = this.projectsResource.value().length;
    const websiteCount = this.websitesResource.value().filter((website) => website.enabled).length;
    const domainsSummary = this.domainsSummaryResource.value();
    const domainsTotal = domainsSummary?.total ?? 0;
    const domainsVerified = domainsSummary?.verified ?? 0;

    const previousLoginAt = this.currentUserStore.previousLoginAt();

    const githubNotLinked = !this.currentUserStore.githubLinked();
    const emailNotVerified = !(this.currentUserStore.profile()?.emailVerified ?? true);
    const alertKeys: readonly string[] = [
      ...(githubNotLinked ? ['dashboard.metrics.systemAlerts.items.githubNotLinked'] : []),
      ...(emailNotVerified ? ['dashboard.metrics.systemAlerts.items.emailNotVerified'] : []),
    ];

    return [
      {
        kind: 'value',
        label: 'dashboard.metrics.activeProjects.label',
        value: String(projectCount),
        hint:
          projectCount === 0 ? 'dashboard.metrics.activeProjects.hintEmpty' : 'dashboard.metrics.activeProjects.hint',
        loading: projectsLoading,
        error: projectsError,
      },
      {
        kind: 'value',
        label: 'dashboard.metrics.activeWebsites.label',
        value: String(websiteCount),
        hint:
          websiteCount === 0 ? 'dashboard.metrics.activeWebsites.hintEmpty' : 'dashboard.metrics.activeWebsites.hint',
        loading: websitesLoading,
        error: websitesError,
      },
      {
        kind: 'value',
        label: 'dashboard.metrics.activeDomains.label',
        value: `${domainsVerified}/${domainsTotal}`,
        hint: domainsTotal === 0 ? 'dashboard.metrics.activeDomains.hintEmpty' : 'dashboard.metrics.activeDomains.hint',
        loading: domainsLoading,
        error: domainsError,
      },
      {
        kind: 'date',
        label: 'dashboard.metrics.lastLogin.label',
        valueDate: previousLoginAt,
        valueKey: 'dashboard.metrics.lastLogin.firstLogin',
        hint: 'dashboard.metrics.lastLogin.hint',
        loading: false,
        error: false,
      },
      {
        kind: 'alerts',
        label: 'dashboard.metrics.systemAlerts.label',
        count: alertKeys.length,
        hintKeys: alertKeys,
        hint: 'dashboard.metrics.systemAlerts.hint',
        loading: false,
        error: false,
      },
    ];
  });

  public readonly activity: Signal<readonly ActivityEntry[]> = computed(() => {
    const projectEntries: readonly ActivityEntry[] = this.projectsResource.value().map((project) => ({
      id: `project-${project.id}`,
      kind: 'project',
      label: project.name,
      link: `/projects/${project.id}`,
      updatedAt: project.updatedAt,
    }));

    const websiteEntries: readonly ActivityEntry[] = this.websitesResource.value().map((website) => ({
      id: `website-${website.id}`,
      kind: 'website',
      label: website.name,
      link: `/websites/${website.id}`,
      updatedAt: website.updatedAt,
    }));

    return [...projectEntries, ...websiteEntries]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  });
}
