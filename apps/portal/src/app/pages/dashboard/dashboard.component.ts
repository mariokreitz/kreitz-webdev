import { ChangeDetectionStrategy, Component, computed, inject, signal, type Signal } from '@angular/core';
import { Card } from '@shared/ui';
import { CurrentUserStore } from '../../core/user';

interface MetricCard {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

interface ActivityEntry {
  readonly label: string;
  readonly timestamp: string;
}

@Component({
  selector: 'kwd-portal-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  templateUrl: './dashboard.component.html',
})
export default class Dashboard {
  private readonly currentUserStore: CurrentUserStore = inject(CurrentUserStore);

  public readonly greetingName: Signal<string> = computed(() => this.currentUserStore.profile()?.name ?? 'there');

  public readonly metrics: Signal<readonly MetricCard[]> = signal([
    { label: 'Active Projects', value: '0', hint: 'No projects yet' },
    { label: 'Active Domains', value: '0', hint: 'No domains yet' },
    { label: 'Last Login', value: 'Just now', hint: 'Current session' },
    { label: 'System Alerts', value: '0', hint: 'All clear' },
  ]);

  public readonly activity: Signal<readonly ActivityEntry[]> = signal([{ label: 'Signed in', timestamp: 'Just now' }]);
}
