import { NgOptimizedImage } from '@angular/common';
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
import { faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@shared/environments';
import { ConfirmDialog, Skeleton } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, Company } from '../../../../core/api';
import { ToastService } from '../../../../core/toast';
import { WebsiteCompanyService, type CreateCompanyPayload } from '../../../../core/websites';
import { CompanyForm, EMPTY_COMPANY_FORM_VALUE, type CompanyFormValue } from './company-form/company-form.component';

function toFormValue(company: Company): CompanyFormValue {
  return {
    name: company.name,
    role: company.role ?? '',
    logoUrl: company.logoUrl ?? '',
    startDate: company.startDate?.slice(0, 10) ?? '',
    endDate: company.endDate?.slice(0, 10) ?? '',
    sortOrder: company.sortOrder,
  };
}

function toPayload(value: CompanyFormValue): CreateCompanyPayload {
  return {
    name: value.name,
    ...(value.role !== '' && { role: value.role }),
    ...(value.logoUrl !== '' && { logoUrl: value.logoUrl }),
    ...(value.startDate !== '' && { startDate: value.startDate }),
    ...(value.endDate !== '' && { endDate: value.endDate }),
    sortOrder: value.sortOrder,
  };
}

@Component({
  selector: 'kwd-portal-companies-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, Skeleton, FontAwesomeModule, TranslatePipe, ConfirmDialog, CompanyForm],
  templateUrl: './companies-section.component.html',
})
export class CompaniesSection {
  public readonly websiteId = input.required<string>();

  private readonly companyService: WebsiteCompanyService = inject(WebsiteCompanyService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly addIcon = faPlus;
  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;

  protected readonly companiesResource = httpResource<readonly Company[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites/${this.websiteId()}/companies`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly Company[]>).data, defaultValue: [] },
  );

  public readonly isAddFormOpen: WritableSignal<boolean> = signal(false);
  public readonly creating: WritableSignal<boolean> = signal(false);
  public readonly updating: WritableSignal<boolean> = signal(false);
  public readonly deleting: WritableSignal<boolean> = signal(false);

  private readonly editingIdSignal: WritableSignal<string | null> = signal(null);
  public readonly editingId: Signal<string | null> = this.editingIdSignal.asReadonly();

  private readonly pendingDeleteSignal: WritableSignal<Company | null> = signal(null);
  public readonly pendingDelete: Signal<Company | null> = this.pendingDeleteSignal.asReadonly();

  protected readonly emptyFormValue = EMPTY_COMPANY_FORM_VALUE;

  public onAddRequested(): void {
    this.editingIdSignal.set(null);
    this.isAddFormOpen.set(true);
  }

  public onAddCancelled(): void {
    this.isAddFormOpen.set(false);
  }

  public async onAddSubmit(value: CompanyFormValue): Promise<void> {
    this.creating.set(true);

    try {
      await this.companyService.create(this.websiteId(), toPayload(value));
      this.companiesResource.reload();
      this.isAddFormOpen.set(false);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.companies.toast.created'),
      });
    } catch {
      // no-op
    } finally {
      this.creating.set(false);
    }
  }

  public initialValueFor(company: Company): CompanyFormValue {
    return toFormValue(company);
  }

  public onEditRequested(company: Company): void {
    this.isAddFormOpen.set(false);
    this.editingIdSignal.set(company.id);
  }

  public onEditCancelled(): void {
    this.editingIdSignal.set(null);
  }

  public async onEditSubmit(company: Company, value: CompanyFormValue): Promise<void> {
    this.updating.set(true);

    try {
      await this.companyService.update(this.websiteId(), company.id, toPayload(value));
      this.companiesResource.reload();
      this.editingIdSignal.set(null);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.companies.toast.updated'),
      });
    } catch {
      // no-op
    } finally {
      this.updating.set(false);
    }
  }

  public onDeleteRequested(company: Company): void {
    this.pendingDeleteSignal.set(company);
  }

  public onDeleteCancelled(): void {
    this.pendingDeleteSignal.set(null);
  }

  public async onDeleteConfirmed(): Promise<void> {
    const company = this.pendingDeleteSignal();

    if (!company) {
      return;
    }

    this.deleting.set(true);

    try {
      await this.companyService.remove(this.websiteId(), company.id);
      this.companiesResource.reload();
      this.pendingDeleteSignal.set(null);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.companies.toast.deleted'),
      });
    } catch {
      // no-op
    } finally {
      this.deleting.set(false);
    }
  }
}
