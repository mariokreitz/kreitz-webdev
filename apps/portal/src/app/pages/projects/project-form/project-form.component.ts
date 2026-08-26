import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';
import { EMPTY_PROJECT_FORM_VALUE, PROJECT_CATEGORY_OPTIONS, type ProjectFormValue } from './types/project-form.types';

const optionalUrlSchema = z.union([z.literal(''), z.url('projects.form.errors.urlInvalid')]);

const projectFormSchema = z.object({
  name: z.string().min(1, 'projects.form.errors.nameRequired').max(200, 'projects.form.errors.nameTooLong'),
  description: z.string().max(2000, 'projects.form.errors.descriptionTooLong'),
  repoUrl: optionalUrlSchema,
  liveUrl: optionalUrlSchema,
  imageUrl: optionalUrlSchema,
  tags: z.string().max(500, 'projects.form.errors.tagsTooLong'),
  category: z.union([
    z.literal(''),
    z.literal('DEMO'),
    z.literal('OPEN_SOURCE'),
    z.literal('POC'),
    z.literal('MVP'),
    z.literal('PLATFORM'),
  ]),
});

@Component({
  selector: 'kwd-portal-project-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, TranslatePipe],
  templateUrl: './project-form.component.html',
})
export class ProjectForm {
  public readonly categoryOptions = PROJECT_CATEGORY_OPTIONS;

  public readonly mode = input.required<'create' | 'edit'>();
  public readonly initialValue = input<ProjectFormValue>(EMPTY_PROJECT_FORM_VALUE);
  public readonly loading = input(false);
  public readonly errorMessage = input<string | null>(null);

  public readonly formSubmitted = output<ProjectFormValue>();

  public readonly isEdit = computed(() => this.mode() === 'edit');

  public readonly submitIcon = computed(() => (this.isEdit() ? faCheck : faPlus));

  public readonly formModel = signal<ProjectFormValue>(EMPTY_PROJECT_FORM_VALUE);

  public readonly projectForm = form(this.formModel, (path) => {
    validateStandardSchema(path, projectFormSchema);
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      untracked(() => {
        this.formModel.set(initialValue);
        this.projectForm().reset();
      });
    });
  }

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.projectForm, async () => {
      this.formSubmitted.emit(this.formModel());
    });
  }
}
