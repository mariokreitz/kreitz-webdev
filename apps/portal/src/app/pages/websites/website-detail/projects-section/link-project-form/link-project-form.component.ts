import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLink, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';
import type { Project } from '../../../../../core/api';

const linkProjectSchema = z.object({
  projectId: z.string().min(1, 'websites.projects.form.errors.required'),
  published: z.boolean(),
});

export type LinkProjectFormValue = z.infer<typeof linkProjectSchema>;

@Component({
  selector: 'kwd-portal-link-project-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, FontAwesomeModule, TranslatePipe],
  templateUrl: './link-project-form.component.html',
})
export class LinkProjectForm {
  public readonly availableProjects = input.required<readonly Project[]>();
  public readonly loading = input(false);

  public readonly submitted = output<LinkProjectFormValue>();
  public readonly cancelled = output();

  protected readonly submitIcon = faLink;
  protected readonly cancelIcon = faXmark;

  protected readonly model = signal<LinkProjectFormValue>({ projectId: '', published: false });
  protected readonly linkForm = form(this.model, (path) => {
    validateStandardSchema(path, linkProjectSchema);
  });

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.linkForm, async () => {
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
