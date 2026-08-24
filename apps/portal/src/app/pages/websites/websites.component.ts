import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal, type Signal, type WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@shared/environments';
import { Card, ConfirmDialog, Skeleton } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, Website } from '../../core/api';
import { ToastService } from '../../core/toast';
import { WebsiteService, type CreateWebsitePayload } from '../../core/websites';
import { CreateWebsiteForm } from './create-website-form/create-website-form.component';

@Component({
  selector: 'kwd-portal-websites',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Skeleton, DatePipe, FontAwesomeModule, RouterLink, TranslatePipe, ConfirmDialog, CreateWebsiteForm],
  templateUrl: './websites.component.html',
})
export default class Websites {
  private readonly websiteService: WebsiteService = inject(WebsiteService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly addIcon = faPlus;
  protected readonly deleteIcon = faTrash;

  protected readonly websitesResource = httpResource<readonly Website[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly Website[]>).data, defaultValue: [] },
  );

  public readonly isFormOpen: WritableSignal<boolean> = signal(false);
  public readonly creating: WritableSignal<boolean> = signal(false);
  public readonly deleting: WritableSignal<boolean> = signal(false);

  private readonly pendingDeleteSignal: WritableSignal<Website | null> = signal(null);
  public readonly pendingDelete: Signal<Website | null> = this.pendingDeleteSignal.asReadonly();

  public onCreateRequested(): void {
    this.isFormOpen.set(true);
  }

  public onCreateCancelled(): void {
    this.isFormOpen.set(false);
  }

  public async onCreateSubmit(payload: CreateWebsitePayload): Promise<void> {
    this.creating.set(true);

    try {
      await this.websiteService.create(payload);
      this.websitesResource.reload();
      this.isFormOpen.set(false);
      this.toastService.show({ severity: 'success', message: this.translate.instant('websites.toast.created') });
    } catch {
      // no-op
    } finally {
      this.creating.set(false);
    }
  }

  public onDeleteRequested(website: Website): void {
    this.pendingDeleteSignal.set(website);
  }

  public onDeleteCancelled(): void {
    this.pendingDeleteSignal.set(null);
  }

  public async onDeleteConfirmed(): Promise<void> {
    const website = this.pendingDeleteSignal();

    if (!website) {
      return;
    }

    this.deleting.set(true);

    try {
      await this.websiteService.remove(website.id);
      this.websitesResource.reload();
      this.pendingDeleteSignal.set(null);
      this.toastService.show({ severity: 'success', message: this.translate.instant('websites.toast.deleted') });
    } catch {
      // no-op
    } finally {
      this.deleting.set(false);
    }
  }
}
