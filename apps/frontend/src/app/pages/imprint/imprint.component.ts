import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { SeoService } from '../../core/seo';

@Component({
  selector: 'kwd-frontend-imprint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, RouterLink, FontAwesomeModule],
  templateUrl: './imprint.component.html',
})
export class Imprint {
  protected readonly faArrowLeft = faArrowLeft;

  private readonly seoService: SeoService = inject(SeoService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  constructor() {
    this.seoService.applyRouteMeta(
      { titleKey: 'seo.imprint.title', descriptionKey: 'seo.imprint.description', path: 'imprint' },
      this.destroyRef,
    );
  }
}
