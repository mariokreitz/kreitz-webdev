import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import type { GithubRepoSummary } from '../../../../../core/api';

@Component({
  selector: 'kwd-portal-repo-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, TranslatePipe],
  templateUrl: './repo-list-item.component.html',
})
export class RepoListItem {
  public readonly repo = input.required<GithubRepoSummary>();
  public readonly importing = input(false);
  public readonly disabled = input(false);

  public readonly importClicked = output<GithubRepoSummary>();

  public readonly lockIcon = faLock;

  public onImportClick(): void {
    if (this.disabled() || this.importing()) {
      return;
    }

    this.importClicked.emit(this.repo());
  }
}
