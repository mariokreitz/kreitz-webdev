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
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@shared/environments';
import { Card, ConfirmDialog, Skeleton } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, Website } from '../../../core/api';
import { ToastService } from '../../../core/toast';
import { WebsiteService } from '../../../core/websites';
import { CompaniesSection } from './companies-section/companies-section.component';
import { DomainsSection } from './domains-section/domains-section.component';
import { ProjectsSection } from './projects-section/projects-section.component';
import { TokensSection } from './tokens-section/tokens-section.component';
import { WebsiteEditForm, type WebsiteEditFormValue } from './website-edit-form/website-edit-form.component';

@Component({
  selector: 'kwd-portal-website-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    Skeleton,
    FontAwesomeModule,
    RouterLink,
    TranslatePipe,
    ConfirmDialog,
    WebsiteEditForm,
    DomainsSection,
    TokensSection,
    ProjectsSection,
    CompaniesSection,
  ],
  templateUrl: './website-detail.component.html',
})
export default class WebsiteDetail {
  public readonly id = input.required<string>();

  private readonly websiteService: WebsiteService = inject(WebsiteService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly router: Router = inject(Router);

  protected readonly backIcon = faArrowLeft;

  protected readonly websiteResource = httpResource<Website | null>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites/${this.id()}`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<Website>).data, defaultValue: null },
  );

  protected readonly editFormValue: Signal<WebsiteEditFormValue> = computed(() => {
    const website = this.websiteResource.value();

    return {
      name: website?.name ?? '',
      enabled: website?.enabled ?? true,
      contactEmail: website?.contactEmail ?? '',
    };
  });

  public readonly saving: WritableSignal<boolean> = signal(false);
  public readonly deleting: WritableSignal<boolean> = signal(false);
  public readonly deleteDialogOpen: WritableSignal<boolean> = signal(false);

  public async onSave(value: WebsiteEditFormValue): Promise<void> {
    this.saving.set(true);

    try {
      const trimmedContactEmail = value.contactEmail.trim();

      await this.websiteService.update(this.id(), {
        name: value.name,
        enabled: value.enabled,
        contactEmail: trimmedContactEmail === '' ? null : trimmedContactEmail,
      });
      this.websiteResource.reload();
      this.toastService.show({ severity: 'success', message: this.translate.instant('websites.toast.updated') });
    } catch {
      // no-op
    } finally {
      this.saving.set(false);
    }
  }

  public onDeleteRequested(): void {
    this.deleteDialogOpen.set(true);
  }

  public onDeleteCancelled(): void {
    this.deleteDialogOpen.set(false);
  }

  public async onDeleteConfirmed(): Promise<void> {
    this.deleting.set(true);

    try {
      await this.websiteService.remove(this.id());
      this.toastService.show({ severity: 'success', message: this.translate.instant('websites.toast.deleted') });
      await this.router.navigateByUrl('/websites');
    } catch {
      this.deleting.set(false);
      this.deleteDialogOpen.set(false);
    }
  }
}
