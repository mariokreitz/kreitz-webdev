import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Skeleton } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';

export interface ActivityEntry {
  readonly id: string;
  readonly kind: 'project' | 'website';
  readonly label: string;
  readonly link: string;
  readonly updatedAt: string;
}

@Component({
  selector: 'kwd-portal-activity-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton, RouterLink, DatePipe, TranslatePipe],
  templateUrl: './activity-feed.component.html',
})
export class ActivityFeed {
  public readonly entries = input.required<readonly ActivityEntry[]>();
  public readonly loading = input.required<boolean>();
  public readonly error = input.required<boolean>();
}
