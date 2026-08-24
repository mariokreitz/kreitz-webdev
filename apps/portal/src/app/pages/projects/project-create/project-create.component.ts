import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Card } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectsService } from '../../../core/projects';
import { ToastService } from '../../../core/toast';
import { ProjectForm } from '../project-form/project-form.component';
import { toProjectPayload } from '../project-form/project-form.utils';
import type { ProjectFormValue } from '../project-form/types/project-form.types';

@Component({
  selector: 'kwd-portal-project-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ProjectForm, RouterLink, TranslatePipe],
  templateUrl: './project-create.component.html',
})
export default class ProjectCreate {
  private readonly projectsService: ProjectsService = inject(ProjectsService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly router: Router = inject(Router);

  public readonly loading = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  public async onFormSubmitted(value: ProjectFormValue): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const created = await this.projectsService.create(toProjectPayload(value));
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('projects.toast.created', { name: created.name }),
      });
      await this.router.navigate(['/projects', created.id]);
    } catch {
      this.errorMessage.set(this.translate.instant('projects.form.errors.submitFailed'));
    } finally {
      this.loading.set(false);
    }
  }
}
