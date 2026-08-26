import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import {
  contactFormSchema,
  type ContactFormStatus,
  type ContactFormSubmission,
  type ContactFormValue,
} from './contact-form.model';

const BLANK_VALUE: ContactFormValue = { name: '', email: '', message: '' };

@Component({
  selector: 'kwd-frontend-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslatePipe],
  templateUrl: './contact-form.component.html',
})
export class ContactForm {
  public readonly status = input<ContactFormStatus>('idle');
  public readonly submitted = output<ContactFormSubmission>();

  protected readonly model = signal<ContactFormValue>({ ...BLANK_VALUE });
  protected readonly contactForm = form(this.model, (path) => {
    validateStandardSchema(path, contactFormSchema);
  });

  protected readonly submitting = computed(() => this.status() === 'submitting');

  private readonly honeypotField = viewChild<ElementRef<HTMLInputElement>>('honeypotField');
  private readonly renderedAtMs = Date.now();

  constructor() {
    effect(() => {
      if (this.status() === 'success') {
        untracked(() => {
          this.model.set({ ...BLANK_VALUE });
          this.contactForm().reset();
        });
      }
    });
  }

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.submitting()) {
      return;
    }

    await submit(this.contactForm, async () => {
      this.submitted.emit({
        ...this.model(),
        honeypot: this.honeypotField()?.nativeElement.value ?? '',
        renderedAtMs: this.renderedAtMs,
      });
    });
  }
}
