import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { Card, Spinner } from '@shared/ui';
import { environment } from '@shared/environments';
import type { ApiEnvelope, Project, Website } from '../../core/api';
import { CurrentUserStore } from '../../core/user';

interface MetricCard {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

interface ActivityEntry {
  readonly id: string;
  readonly label: string;
  readonly timestamp: string;
}

@Component({
  selector: 'kwd-portal-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Spinner],
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

  public readonly greetingName: Signal<string> = computed(() => this.currentUserStore.profile()?.name ?? 'there');

  public readonly isLoading: Signal<boolean> = computed(
    () => this.projectsResource.isLoading() || this.websitesResource.isLoading(),
  );

  public readonly hasError: Signal<boolean> = computed(
    () => this.projectsResource.error() !== undefined || this.websitesResource.error() !== undefined,
  );

  public readonly metrics: Signal<readonly MetricCard[]> = computed(() => {
    const projectCount = this.projectsResource.value().length;
    const websiteCount = this.websitesResource.value().filter((website) => website.enabled).length;

    return [
      {
        label: 'Active Projects',
        value: String(projectCount),
        hint: projectCount === 0 ? 'No projects yet' : 'In your account',
      },
      {
        label: 'Active Websites',
        value: String(websiteCount),
        hint: websiteCount === 0 ? 'No websites yet' : 'Currently configured',
      },
      { label: 'Active Domains', value: '—', hint: 'Coming soon' },
      {
        label: 'Last Login',
        value: this.currentUserStore.sessionCreatedAt()?.toLocaleString() ?? 'Just now',
        hint: 'Current session',
      },
      { label: 'System Alerts', value: '0', hint: 'All clear' },
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
