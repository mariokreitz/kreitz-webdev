import { ChangeDetectionStrategy, Component, computed, input, output, type Signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faRotate, faStar } from '@fortawesome/free-solid-svg-icons';
import { Spinner } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import type { Project } from '../../../../core/api';

@Component({
  selector: 'kwd-portal-github-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, Spinner, TranslatePipe],
  templateUrl: './github-status.component.html',
})
export class GithubStatus {
  public readonly project = input.required<Project>();
  public readonly refreshing = input(false);

  public readonly refreshRequested = output();

  public readonly githubIcon = faGithub;
  public readonly liveIcon = faArrowUpRightFromSquare;
  public readonly refreshIcon = faRotate;
  public readonly starIcon = faStar;

  public readonly lastSyncedLabel: Signal<string | null> = computed(() => {
    const lastSyncedAt = this.project().lastSyncedAt;

    return lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : null;
  });

  public onRefreshClick(): void {
    if (this.refreshing()) {
      return;
    }

    this.refreshRequested.emit();
  }
}
