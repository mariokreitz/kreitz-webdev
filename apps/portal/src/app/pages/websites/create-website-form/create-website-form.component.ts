import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';

const createWebsiteSchema = z.object({
  name: z.string().min(1, 'websites.form.errors.nameRequired').max(100, 'websites.form.errors.nameTooLong'),
  url: z.url('websites.form.errors.urlInvalid'),
});

export type CreateWebsiteFormValue = z.infer<typeof createWebsiteSchema>;

@Component({
  selector: 'kwd-portal-create-website-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, FontAwesomeModule, TranslatePipe],
  templateUrl: './create-website-form.component.html',
})
export class CreateWebsiteForm {
  public readonly loading = input(false);

  public readonly submitted = output<CreateWebsiteFormValue>();
  public readonly cancelled = output();

  protected readonly submitIcon = faPlus;
  protected readonly cancelIcon = faXmark;

  protected readonly model = signal<CreateWebsiteFormValue>({ name: '', url: '' });
  protected readonly websiteForm = form(this.model, (path) => {
    validateStandardSchema(path, createWebsiteSchema);
  });

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.websiteForm, async () => {
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
