import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SeoService } from '../../core/seo';
import { LegalPageShell } from '../legal-page-shell/legal-page-shell.component';

@Component({
  selector: 'kwd-frontend-imprint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, LegalPageShell],
  templateUrl: './imprint.component.html',
})
export class Imprint {
  private readonly seoService: SeoService = inject(SeoService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  constructor() {
    this.seoService.applyRouteMeta(
      { titleKey: 'seo.imprint.title', descriptionKey: 'seo.imprint.description', path: 'imprint' },
      this.destroyRef,
    );
  }
}
