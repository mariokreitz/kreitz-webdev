import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SeoService } from '../../core/seo';
import { LegalPageShell } from '../legal-page-shell/legal-page-shell.component';

@Component({
  selector: 'kwd-frontend-privacy-policy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, LegalPageShell],
  templateUrl: './privacy-policy.component.html',
})
export class PrivacyPolicy {
  private readonly seoService: SeoService = inject(SeoService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  constructor() {
    this.seoService.applyRouteMeta(
      { titleKey: 'seo.privacyPolicy.title', descriptionKey: 'seo.privacyPolicy.description', path: 'privacy-policy' },
      this.destroyRef,
    );
  }
}
