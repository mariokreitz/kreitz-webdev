import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { SeoService } from '../../core/seo';

@Component({
  selector: 'kwd-frontend-privacy-policy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, RouterLink, FontAwesomeModule],
  templateUrl: './privacy-policy.component.html',
})
export class PrivacyPolicy {
  protected readonly faArrowLeft = faArrowLeft;

  private readonly seoService: SeoService = inject(SeoService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  constructor() {
    this.seoService.applyRouteMeta(
      { titleKey: 'seo.privacyPolicy.title', descriptionKey: 'seo.privacyPolicy.description', path: 'privacy-policy' },
      this.destroyRef,
    );
  }
}
