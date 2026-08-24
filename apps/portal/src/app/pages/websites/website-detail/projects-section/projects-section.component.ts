import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLink, faTrash } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@shared/environments';
import { ConfirmDialog, Skeleton } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, Project, WebsiteProjectLinkWithProject } from '../../../../core/api';
import { ToastService } from '../../../../core/toast';
import { WebsiteProjectService } from '../../../../core/websites';
import { LinkProjectForm, type LinkProjectFormValue } from './link-project-form/link-project-form.component';

@Component({
  selector: 'kwd-portal-projects-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton, FontAwesomeModule, TranslatePipe, ConfirmDialog, LinkProjectForm],
  templateUrl: './projects-section.component.html',
})
export class ProjectsSection {
  public readonly websiteId = input.required<string>();

  private readonly projectService: WebsiteProjectService = inject(WebsiteProjectService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly linkIcon = faLink;
  protected readonly unlinkIcon = faTrash;

  protected readonly linksResource = httpResource<readonly WebsiteProjectLinkWithProject[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites/${this.websiteId()}/projects`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly WebsiteProjectLinkWithProject[]>).data, defaultValue: [] },
  );

  protected readonly projectsResource = httpResource<readonly Project[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/projects`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly Project[]>).data, defaultValue: [] },
  );

  protected readonly availableProjects: Signal<readonly Project[]> = computed(() => {
    const linkedIds = new Set(this.linksResource.value().map((link) => link.projectId));
    return this.projectsResource.value().filter((project) => !linkedIds.has(project.id));
  });

  public readonly isFormOpen: WritableSignal<boolean> = signal(false);
  public readonly linking: WritableSignal<boolean> = signal(false);
  public readonly updatingId: WritableSignal<string | null> = signal(null);
  public readonly unlinking: WritableSignal<boolean> = signal(false);

  private readonly pendingUnlinkSignal: WritableSignal<WebsiteProjectLinkWithProject | null> = signal(null);
  public readonly pendingUnlink: Signal<WebsiteProjectLinkWithProject | null> = this.pendingUnlinkSignal.asReadonly();

  public onLinkRequested(): void {
    this.isFormOpen.set(true);
  }

  public onLinkCancelled(): void {
    this.isFormOpen.set(false);
  }

  public async onLinkSubmit(value: LinkProjectFormValue): Promise<void> {
    this.linking.set(true);

    try {
      await this.projectService.create(this.websiteId(), value);
      this.linksResource.reload();
      this.isFormOpen.set(false);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.projects.toast.linked'),
      });
    } catch {
      // no-op
    } finally {
      this.linking.set(false);
    }
  }

  public async onTogglePublished(link: WebsiteProjectLinkWithProject): Promise<void> {
    this.updatingId.set(link.id);

    try {
      await this.projectService.update(this.websiteId(), link.projectId, { published: !link.published });
      this.linksResource.reload();
    } catch {
      // no-op
    } finally {
      this.updatingId.set(null);
    }
  }

  public onUnlinkRequested(link: WebsiteProjectLinkWithProject): void {
    this.pendingUnlinkSignal.set(link);
  }

  public onUnlinkCancelled(): void {
    this.pendingUnlinkSignal.set(null);
  }

  public async onUnlinkConfirmed(): Promise<void> {
    const link = this.pendingUnlinkSignal();

    if (!link) {
      return;
    }

    this.unlinking.set(true);

    try {
      await this.projectService.remove(this.websiteId(), link.projectId);
      this.linksResource.reload();
      this.pendingUnlinkSignal.set(null);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.projects.toast.unlinked'),
      });
    } catch {
      // no-op
    } finally {
      this.unlinking.set(false);
    }
  }
}
