import { DOCUMENT, inject, Injectable, type DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { SITE_URL } from './constants';
import type { SeoRouteData } from './types/seo.types';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title: Title = inject(Title);
  private readonly meta: Meta = inject(Meta);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly document: Document = inject(DOCUMENT);

  public applyRouteMeta(route: SeoRouteData, destroyRef: DestroyRef): void {
    this.translate
      .stream([route.titleKey, route.descriptionKey])
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((translations: Record<string, string>) => {
        const title = translations[route.titleKey] ?? route.titleKey;
        const description = translations[route.descriptionKey] ?? route.descriptionKey;
        this.render(title, description, route.path);
      });
  }

  private render(title: string, description: string, path: string): void {
    const url = path ? `${SITE_URL}/${path}` : `${SITE_URL}/`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }
}
