import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';

const editNameSchema = z.object({
  name: z.string().min(1, 'profile.editName.errors.required').max(120, 'profile.editName.errors.tooLong'),
});

@Component({
  selector: 'kwd-portal-edit-name-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, FontAwesomeModule, TranslatePipe],
  templateUrl: './edit-name-form.component.html',
})
export class EditNameForm {
  public readonly initialName = input.required<string>();
  public readonly loading = input(false);
  public readonly errorMessage = input<string | null>(null);

  public readonly nameSaved = output<string>();
  public readonly editCancelled = output();

  public readonly saveIcon = faCheck;
  public readonly cancelIcon = faXmark;

  public readonly nameModel = signal<z.infer<typeof editNameSchema>>({ name: '' });

  public readonly nameForm = form(this.nameModel, (path) => {
    validateStandardSchema(path, editNameSchema);
  });

  constructor() {
    effect(() => {
      const initialName = this.initialName();

      untracked(() => {
        this.nameModel.set({ name: initialName });
        this.nameForm().reset();
      });
    });
  }

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.nameForm, async () => {
      this.nameSaved.emit(this.nameModel().name);
    });
  }

  public onCancel(): void {
    if (this.loading()) {
      return;
    }

    this.editCancelled.emit();
  }
}
