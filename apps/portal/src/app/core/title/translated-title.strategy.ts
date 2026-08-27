import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PRIMARY_OUTLET, TitleStrategy, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import type { TitleRouteData } from './types/title-route-data.types';

@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title: Title = inject(Title);
  private readonly translate: TranslateService = inject(TranslateService);
  private currentTitleKey: string | null = null;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.applyCurrentTitle());
  }

  public override updateTitle(snapshot: RouterStateSnapshot): void {
    this.currentTitleKey = this.resolveTitleKey(snapshot);
    this.applyCurrentTitle();
  }

  private resolveTitleKey(snapshot: RouterStateSnapshot): string | null {
    let titleKey: string | null = null;
    let route: ActivatedRouteSnapshot | undefined = snapshot.root;

    while (route !== undefined) {
      const data = route.data as Partial<TitleRouteData>;
      titleKey = data.titleKey ?? titleKey;
      route = route.children.find((child) => child.outlet === PRIMARY_OUTLET);
    }

    return titleKey;
  }

  private applyCurrentTitle(): void {
    if (this.currentTitleKey === null) {
      return;
    }

    this.title.setTitle(this.translate.instant(this.currentTitleKey));
  }
}
