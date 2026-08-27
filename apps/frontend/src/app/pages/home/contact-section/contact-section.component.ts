import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { SocialLinksService } from '../../../core/social-links';
import { ContactForm } from './contact-form/contact-form.component';
import type { ContactFormStatus, ContactFormSubmission } from './contact-form/contact-form.model';
import type { PublicSocialLink } from '../public-social-link.model';
import {
  socialLinkEmailAddress,
  socialLinkHref,
  socialLinkIcon,
  socialLinkLabel,
  socialLinkTarget,
} from '../social-link-display';

const CONTACT_ENDPOINT = '/api/contact';
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

@Component({
  selector: 'kwd-frontend-contact-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContactForm, FontAwesomeModule, TranslatePipe],
  templateUrl: './contact-section.component.html',
})
export class ContactSection {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly socialLinksService: SocialLinksService = inject(SocialLinksService);

  protected readonly status: WritableSignal<ContactFormStatus> = signal('idle');
  protected readonly socialLinks: Signal<readonly PublicSocialLink[]> = this.socialLinksService.links;
  protected readonly emailLink: Signal<PublicSocialLink | undefined> = computed(() =>
    this.socialLinks().find((link) => link.platform.toLowerCase() === 'email'),
  );

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

  protected iconFor(link: PublicSocialLink): IconDefinition {
    return socialLinkIcon(link.platform);
  }

  protected labelFor(link: PublicSocialLink): string {
    return socialLinkLabel(link);
  }

  protected hrefFor(link: PublicSocialLink): string {
    return socialLinkHref(link);
  }

  protected targetFor(link: PublicSocialLink): '_blank' | null {
    return socialLinkTarget(link);
  }

  protected emailAddressFor(link: PublicSocialLink): string {
    return socialLinkEmailAddress(link);
  }

  protected umamiEventFor(link: PublicSocialLink): string {
    return `contact-chip-${link.platform.toLowerCase()}`;
  }
}
