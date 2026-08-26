import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';

const optionalUrlSchema = z.union([z.literal(''), z.url('websites.companies.form.errors.logoUrlInvalid')]);

const companyFormSchema = z.object({
  name: z
    .string()
    .min(1, 'websites.companies.form.errors.nameRequired')
    .max(200, 'websites.companies.form.errors.nameTooLong'),
  role: z.string().max(200, 'websites.companies.form.errors.roleTooLong'),
  logoUrl: optionalUrlSchema,
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z
    .number()
    .int('websites.companies.form.errors.sortOrderInvalid')
    .min(0, 'websites.companies.form.errors.sortOrderInvalid'),
});

export type CompanyFormValue = z.infer<typeof companyFormSchema>;

export const EMPTY_COMPANY_FORM_VALUE: CompanyFormValue = {
  name: '',
  role: '',
  logoUrl: '',
  startDate: '',
  endDate: '',
  sortOrder: 0,
};

@Component({
  selector: 'kwd-portal-company-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, FontAwesomeModule, TranslatePipe],
  templateUrl: './company-form.component.html',
})
export class CompanyForm {
  public readonly mode = input.required<'create' | 'edit'>();
  public readonly initialValue = input<CompanyFormValue>(EMPTY_COMPANY_FORM_VALUE);
  public readonly loading = input(false);

  public readonly formSubmitted = output<CompanyFormValue>();
  public readonly cancelled = output();

  protected readonly isEdit = computed(() => this.mode() === 'edit');
  protected readonly submitIcon = computed(() => (this.isEdit() ? faCheck : faPlus));
  protected readonly cancelIcon = faXmark;

  protected readonly formModel = signal<CompanyFormValue>(EMPTY_COMPANY_FORM_VALUE);
  protected readonly companyForm = form(this.formModel, (path) => {
    validateStandardSchema(path, companyFormSchema);
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      untracked(() => {
        this.formModel.set(initialValue);
        this.companyForm().reset();
      });
    });
  }

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.companyForm, async () => {
      this.formSubmitted.emit(this.formModel());
    });
  }

  public onCancel(): void {
    if (this.loading()) {
      return;
    }

    this.cancelled.emit();
  }
}
