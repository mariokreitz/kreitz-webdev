import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@shared/environments';
import { ConfirmDialog, Skeleton } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, WebsiteDomain } from '../../../../core/api';
import { ToastService } from '../../../../core/toast';
import { WebsiteDomainService } from '../../../../core/websites';
import { CreateDomainForm, type CreateDomainFormValue } from './create-domain-form/create-domain-form.component';

@Component({
  selector: 'kwd-portal-domains-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton, FontAwesomeModule, TranslatePipe, ConfirmDialog, CreateDomainForm],
  templateUrl: './domains-section.component.html',
})
export class DomainsSection {
  public readonly websiteId = input.required<string>();

  private readonly domainService: WebsiteDomainService = inject(WebsiteDomainService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly addIcon = faPlus;
  protected readonly deleteIcon = faTrash;

  protected readonly domainsResource = httpResource<readonly WebsiteDomain[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites/${this.websiteId()}/domains`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly WebsiteDomain[]>).data, defaultValue: [] },
  );

  public readonly isFormOpen: WritableSignal<boolean> = signal(false);
  public readonly creating: WritableSignal<boolean> = signal(false);
  public readonly deleting: WritableSignal<boolean> = signal(false);

  private readonly pendingDeleteSignal: WritableSignal<WebsiteDomain | null> = signal(null);
  public readonly pendingDelete: Signal<WebsiteDomain | null> = this.pendingDeleteSignal.asReadonly();

  public onAddRequested(): void {
    this.isFormOpen.set(true);
  }

  public onAddCancelled(): void {
    this.isFormOpen.set(false);
  }

  public async onAddSubmit(value: CreateDomainFormValue): Promise<void> {
    this.creating.set(true);

    try {
      await this.domainService.create(this.websiteId(), value);
      this.domainsResource.reload();
      this.isFormOpen.set(false);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.domains.toast.created'),
      });
    } catch {
      // no-op
    } finally {
      this.creating.set(false);
    }
  }

  public onDeleteRequested(domain: WebsiteDomain): void {
    this.pendingDeleteSignal.set(domain);
  }

  public onDeleteCancelled(): void {
    this.pendingDeleteSignal.set(null);
  }

  public async onDeleteConfirmed(): Promise<void> {
    const domain = this.pendingDeleteSignal();

    if (!domain) {
      return;
    }

    this.deleting.set(true);

    try {
      await this.domainService.remove(this.websiteId(), domain.id);
      this.domainsResource.reload();
      this.pendingDeleteSignal.set(null);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.domains.toast.deleted'),
      });
    } catch {
      // no-op
    } finally {
      this.deleting.set(false);
    }
  }
}
