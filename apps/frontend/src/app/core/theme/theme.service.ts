import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal, type Signal, type WritableSignal } from '@angular/core';
import { THEME_ATTRIBUTE } from './constants';
import type { Theme } from './types/theme.types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document: Document = inject(DOCUMENT);
  private readonly themeSignal: WritableSignal<Theme>;
  public readonly theme: Signal<Theme>;

  constructor() {
    this.themeSignal = signal<Theme>(this.resolveInitialTheme());
    this.theme = this.themeSignal.asReadonly();
    this.applyTheme(this.themeSignal());
  }

  private applyTheme(theme: Theme): void {
    this.document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  }

  private resolveInitialTheme(): Theme {
    return 'dark';
  }
}
