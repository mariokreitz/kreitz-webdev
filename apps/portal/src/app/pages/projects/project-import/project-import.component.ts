import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { Card, Spinner } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { GithubRepoSummary } from '../../../core/api';
import { GithubImportService } from '../../../core/projects';
import { ToastService } from '../../../core/toast';
import { GithubRepoBrowser } from './github-repo-browser/github-repo-browser.component';

@Component({
  selector: 'kwd-portal-project-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, GithubRepoBrowser, RouterLink, FontAwesomeModule, Spinner, TranslatePipe],
  templateUrl: './project-import.component.html',
})
export default class ProjectImport {
  private readonly githubImportService: GithubImportService = inject(GithubImportService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly router: Router = inject(Router);

  public readonly githubIcon = faGithub;
  public readonly importingRepoId = signal<string | null>(null);

  public async onRepoSelected(repo: GithubRepoSummary): Promise<void> {
    this.importingRepoId.set(repo.githubId);

    try {
      const owner = repo.fullName.split('/')[0] ?? repo.fullName;
      const created = await this.githubImportService.importRepo(repo.githubId, owner, repo.name);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('projects.import.toast.success', { name: created.name }),
      });
      await this.router.navigate(['/projects', created.id]);
    } catch {
      // no-op
    } finally {
      this.importingRepoId.set(null);
    }
  }
}
