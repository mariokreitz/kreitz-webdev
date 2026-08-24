import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';

const createDomainSchema = z.object({
  domain: z.string().min(1, 'websites.domains.form.errors.required').max(253, 'websites.domains.form.errors.required'),
});

export type CreateDomainFormValue = z.infer<typeof createDomainSchema>;

@Component({
  selector: 'kwd-portal-create-domain-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, FontAwesomeModule, TranslatePipe],
  templateUrl: './create-domain-form.component.html',
})
export class CreateDomainForm {
  public readonly loading = input(false);

  public readonly submitted = output<CreateDomainFormValue>();
  public readonly cancelled = output();

  protected readonly submitIcon = faPlus;
  protected readonly cancelIcon = faXmark;

  protected readonly model = signal<CreateDomainFormValue>({ domain: '' });
  protected readonly domainForm = form(this.model, (path) => {
    validateStandardSchema(path, createDomainSchema);
  });

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.domainForm, async () => {
      this.submitted.emit(this.model());
    });
  }

  public onCancel(): void {
    if (this.loading()) {
      return;
    }

    this.cancelled.emit();
  }
}
