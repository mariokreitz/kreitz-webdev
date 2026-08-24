import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';

const createTokenSchema = z.object({
  name: z
    .string()
    .min(1, 'websites.tokens.form.errors.nameRequired')
    .max(100, 'websites.tokens.form.errors.nameRequired'),
  expiresAt: z.string(),
});

export type CreateTokenFormValue = z.infer<typeof createTokenSchema>;

@Component({
  selector: 'kwd-portal-create-token-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, FontAwesomeModule, TranslatePipe],
  templateUrl: './create-token-form.component.html',
})
export class CreateTokenForm {
  public readonly loading = input(false);

  public readonly submitted = output<CreateTokenFormValue>();
  public readonly cancelled = output();

  protected readonly submitIcon = faPlus;
  protected readonly cancelIcon = faXmark;

  protected readonly model = signal<CreateTokenFormValue>({ name: '', expiresAt: '' });
  protected readonly tokenForm = form(this.model, (path) => {
    validateStandardSchema(path, createTokenSchema);
  });

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.tokenForm, async () => {
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
