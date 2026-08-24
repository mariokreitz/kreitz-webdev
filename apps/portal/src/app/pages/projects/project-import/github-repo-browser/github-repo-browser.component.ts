import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, input, output, signal, type Signal } from '@angular/core';
import { Skeleton } from '@shared/ui';
import { environment } from '@shared/environments';
import { TranslatePipe } from '@ngx-translate/core';
import type { ApiEnvelope, GithubRepoSummary } from '../../../../core/api';
import { RepoListItem } from './repo-list-item/repo-list-item.component';

@Component({
  selector: 'kwd-portal-github-repo-browser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RepoListItem, Skeleton, TranslatePipe],
  templateUrl: './github-repo-browser.component.html',
})
export class GithubRepoBrowser {
  public readonly importingRepoId = input<string | null>(null);

  public readonly repoSelected = output<GithubRepoSummary>();

  public readonly searchQuery = signal('');

  private readonly reposResource = httpResource<readonly GithubRepoSummary[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/projects/github/repos`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly GithubRepoSummary[]>).data, defaultValue: [] },
  );

  public readonly isLoading: Signal<boolean> = computed(() => this.reposResource.isLoading());

  public readonly isError: Signal<boolean> = computed(() => this.reposResource.error() !== undefined);

  public readonly filteredRepos: Signal<readonly GithubRepoSummary[]> = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const repos = this.reposResource.value();

    if (!query) {
      return repos;
    }

    return repos.filter(
      (repo) => repo.fullName.toLowerCase().includes(query) || (repo.description ?? '').toLowerCase().includes(query),
    );
  });

  public onImportClick(repo: GithubRepoSummary): void {
    this.repoSelected.emit(repo);
  }

  public onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
