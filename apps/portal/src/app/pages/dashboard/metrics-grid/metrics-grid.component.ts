import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Card, Skeleton } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';

interface MetricCardBase {
  readonly label: string;
  readonly hint: string;
  readonly loading: boolean;
  readonly error: boolean;
}

export type MetricCard =
  | (MetricCardBase & { readonly kind: 'value'; readonly value: string })
  | (MetricCardBase & { readonly kind: 'date'; readonly valueDate: Date | null; readonly valueKey: string })
  | (MetricCardBase & { readonly kind: 'alerts'; readonly count: number; readonly hintKeys: readonly string[] });

@Component({
  selector: 'kwd-portal-metrics-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Skeleton, DatePipe, TranslatePipe],
  templateUrl: './metrics-grid.component.html',
})
export class MetricsGrid {
  public readonly metrics = input.required<readonly MetricCard[]>();
}
