import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal, type WritableSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ContactForm } from './contact-form/contact-form.component';
import type { ContactFormStatus, ContactFormSubmission } from './contact-form/contact-form.model';

const CONTACT_ENDPOINT = '/api/contact';
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

@Component({
  selector: 'kwd-frontend-contact-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContactForm, TranslatePipe],
  templateUrl: './contact-section.component.html',
})
export class ContactSection {
  private readonly http: HttpClient = inject(HttpClient);

  protected readonly status: WritableSignal<ContactFormStatus> = signal('idle');

  public async onSubmit(value: ContactFormSubmission): Promise<void> {
    this.status.set('submitting');

    try {
      await firstValueFrom(this.http.post(CONTACT_ENDPOINT, value));

      this.status.set('success');
    } catch (error) {
      const isRateLimited = error instanceof HttpErrorResponse && error.status === HTTP_STATUS_TOO_MANY_REQUESTS;
      this.status.set(isRateLimited ? 'rate-limited' : 'error');
    }
  }
}
