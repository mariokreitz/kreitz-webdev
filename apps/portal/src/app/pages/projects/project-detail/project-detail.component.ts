import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal, type Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Card, ConfirmDialog, Skeleton } from '@shared/ui';
import { environment } from '@shared/environments';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, Project } from '../../../core/api';
import { GithubImportService, ProjectsService } from '../../../core/projects';
import { ToastService } from '../../../core/toast';
import { GithubStatus } from './github-status/github-status.component';
import { ProjectForm } from '../project-form/project-form.component';
import { toProjectPayload } from '../project-form/project-form.utils';
import { EMPTY_PROJECT_FORM_VALUE, type ProjectFormValue } from '../project-form/types/project-form.types';

@Component({
  selector: 'kwd-portal-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Skeleton, ProjectForm, ConfirmDialog, GithubStatus, RouterLink, TranslatePipe],
  templateUrl: './project-detail.component.html',
})
export default class ProjectDetail {
  public readonly id = input.required<string>();

  private readonly projectsService: ProjectsService = inject(ProjectsService);
  private readonly githubImportService: GithubImportService = inject(GithubImportService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly router: Router = inject(Router);

  private readonly projectResource = httpResource<Project>(
    () => ({ url: `${environment.api.kreitzWebdev}/projects/${this.id()}`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<Project>).data },
  );

  public readonly isLoading: Signal<boolean> = computed(() => this.projectResource.isLoading());

  public readonly isError: Signal<boolean> = computed(() => this.projectResource.error() !== undefined);

  public readonly project: Signal<Project | undefined> = computed(() => this.projectResource.value());

  public readonly initialFormValue: Signal<ProjectFormValue> = computed(() => {
    const project = this.projectResource.value();

    if (!project) {
      return EMPTY_PROJECT_FORM_VALUE;
    }

    return {
      name: project.name,
      description: project.description ?? '',
      repoUrl: project.repoUrl ?? '',
      liveUrl: project.liveUrl ?? '',
      imageUrl: project.imageUrl ?? '',
      tags: project.tags.join(', '),
      category: project.category ?? '',
    };
  });

  public readonly saving = signal(false);
  public readonly saveErrorMessage = signal<string | null>(null);
  public readonly deleting = signal(false);
  public readonly deleteDialogOpen = signal(false);
  public readonly refreshing = signal(false);

  public readonly deleteDialogMessage: Signal<string> = computed(() => {
    const project = this.projectResource.value();

    return project ? this.translate.instant('projects.deleteDialog.message', { name: project.name }) : '';
  });

  public async onFormSubmitted(value: ProjectFormValue): Promise<void> {
    this.saving.set(true);
    this.saveErrorMessage.set(null);

    try {
      const updated = await this.projectsService.update(this.id(), toProjectPayload(value));
      this.projectResource.set(updated);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('projects.toast.updated', { name: updated.name }),
      });
    } catch {
      this.saveErrorMessage.set(this.translate.instant('projects.form.errors.submitFailed'));
    } finally {
      this.saving.set(false);
    }
  }

  public async onRefreshRequested(): Promise<void> {
    if (this.refreshing()) {
      return;
    }

    this.refreshing.set(true);

    try {
      const updated = await this.githubImportService.refresh(this.id());
      this.projectResource.set(updated);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('projects.toast.refreshed', { name: updated.name }),
      });
    } catch {
      this.toastService.show({
        severity: 'error',
        message: this.translate.instant('projects.toast.refreshFailed'),
      });
    } finally {
      this.refreshing.set(false);
    }
  }

  public onDeleteRequested(): void {
    this.deleteDialogOpen.set(true);
  }

  public onDeleteCancelled(): void {
    this.deleteDialogOpen.set(false);
  }

  public async onDeleteConfirmed(): Promise<void> {
    const project = this.projectResource.value();

    if (!project) {
      return;
    }

    this.deleting.set(true);

    try {
      await this.projectsService.remove(project.id);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('projects.toast.deleted', { name: project.name }),
      });
      await this.router.navigateByUrl('/projects');
    } catch {
      // no-op
    } finally {
      this.deleting.set(false);
      this.deleteDialogOpen.set(false);
    }
  }
}
