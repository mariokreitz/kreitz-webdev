import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal, type WritableSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ContactForm, type ContactFormStatus, type ContactFormSubmission } from './contact-form/contact-form.component';

interface ContactFormApiResponse {
  readonly ok: boolean;
  readonly error?: string;
}

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
      await firstValueFrom(this.http.post<ContactFormApiResponse>('/api/contact', value));

      this.status.set('success');
    } catch (error) {
      this.status.set(error instanceof HttpErrorResponse && error.status === 429 ? 'rate-limited' : 'error');
    }
  }
}
