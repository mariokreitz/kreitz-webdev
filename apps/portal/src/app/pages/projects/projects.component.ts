import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faDiagramProject, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog, Skeleton } from '@shared/ui';
import { environment } from '@shared/environments';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, Project } from '../../core/api';
import { ProjectsService } from '../../core/projects';
import { ToastService } from '../../core/toast';
import { CurrentUserStore } from '../../core/user';
import { ProjectCard } from './project-card/project-card.component';

@Component({
  selector: 'kwd-portal-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FontAwesomeModule, TranslatePipe, Skeleton, ProjectCard, ConfirmDialog],
  templateUrl: './projects.component.html',
})
export default class Projects {
  private readonly currentUserStore: CurrentUserStore = inject(CurrentUserStore);
  private readonly projectsService: ProjectsService = inject(ProjectsService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  public readonly addIcon = faPlus;
  public readonly githubIcon = faGithub;
  public readonly emptyIcon = faDiagramProject;

  private readonly projectsResource = httpResource<readonly Project[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/projects`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly Project[]>).data, defaultValue: [] },
  );

  private readonly deleteTargetSignal: WritableSignal<Project | null> = signal(null);
  private readonly deletingSignal: WritableSignal<boolean> = signal(false);

  public readonly isLoading: Signal<boolean> = computed(() => this.projectsResource.isLoading());

  public readonly isError: Signal<boolean> = computed(() => this.projectsResource.error() !== undefined);

  public readonly projects: Signal<readonly Project[]> = computed(() => this.projectsResource.value());

  public readonly githubLinked: Signal<boolean> = computed(() => this.currentUserStore.githubLinked());

  public readonly deleteTarget: Signal<Project | null> = this.deleteTargetSignal.asReadonly();

  public readonly isDeleting: Signal<boolean> = this.deletingSignal.asReadonly();

  public readonly deleteDialogOpen: Signal<boolean> = computed(() => this.deleteTargetSignal() !== null);

  public readonly deleteDialogMessage: Signal<string> = computed(() => {
    const target = this.deleteTargetSignal();

    return target ? this.translate.instant('projects.deleteDialog.message', { name: target.name }) : '';
  });

  public onDeleteRequested(projectId: string): void {
    const target = this.projectsResource.value().find((project) => project.id === projectId) ?? null;
    this.deleteTargetSignal.set(target);
  }

  public onDeleteCancelled(): void {
    this.deleteTargetSignal.set(null);
  }

  public async onDeleteConfirmed(): Promise<void> {
    const target = this.deleteTargetSignal();

    if (!target) {
      return;
    }

    this.deletingSignal.set(true);

    try {
      await this.projectsService.remove(target.id);
      this.projectsResource.reload();
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('projects.toast.deleted', { name: target.name }),
      });
      this.deleteTargetSignal.set(null);
    } catch {
      // no-op
    } finally {
      this.deletingSignal.set(false);
    }
  }
}
