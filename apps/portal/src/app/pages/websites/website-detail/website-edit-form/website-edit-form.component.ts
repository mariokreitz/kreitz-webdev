import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';

const websiteEditSchema = z.object({
  name: z.string().min(1, 'websites.form.errors.nameRequired').max(100, 'websites.form.errors.nameTooLong'),
  enabled: z.boolean(),
  contactEmail: z.union([z.literal(''), z.email('websites.form.errors.contactEmailInvalid')]),
});

export type WebsiteEditFormValue = z.infer<typeof websiteEditSchema>;

@Component({
  selector: 'kwd-portal-website-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, FontAwesomeModule, TranslatePipe],
  templateUrl: './website-edit-form.component.html',
})
export class WebsiteEditForm {
  public readonly initialValue = input.required<WebsiteEditFormValue>();
  public readonly loading = input(false);

  public readonly saved = output<WebsiteEditFormValue>();

  protected readonly saveIcon = faCheck;

  protected readonly model = signal<WebsiteEditFormValue>({ name: '', enabled: true, contactEmail: '' });
  protected readonly editForm = form(this.model, (path) => {
    validateStandardSchema(path, websiteEditSchema);
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      untracked(() => {
        this.model.set(initialValue);
        this.editForm().reset();
      });
    });
  }

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.editForm, async () => {
      this.saved.emit(this.model());
    });
  }
}
