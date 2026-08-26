import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal, type Signal, type WritableSignal } from '@angular/core';
import { PagePreferencesStore } from '../preferences';
import { THEME_ATTRIBUTE } from './constants';
import type { Theme } from './types/theme.types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly preferencesStore: PagePreferencesStore = inject(PagePreferencesStore);
  private readonly document: Document = inject(DOCUMENT);
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly themeSignal: WritableSignal<Theme>;
  public readonly theme: Signal<Theme>;

  constructor() {
    this.themeSignal = signal<Theme>(this.resolveInitialTheme());
    this.theme = this.themeSignal.asReadonly();
    this.applyTheme(this.themeSignal());

    if (this.isBrowser) {
      this.watchSystemPreference();
    }
  }

  public toggle(): void {
    this.setTheme(this.themeSignal() === 'dark' ? 'light' : 'dark');
  }

  public setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    this.preferencesStore.set({ theme });
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    this.document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  }

  private resolveInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'light';
    }

    const stored = this.preferencesStore.getRaw().theme;

    if (stored) {
      return stored;
    }

    return this.prefersDark() ? 'dark' : 'light';
  }

  private prefersDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private watchSystemPreference(): void {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent): void => {
      if (this.preferencesStore.getRaw().theme !== undefined) {
        return;
      }

      const theme: Theme = event.matches ? 'dark' : 'light';
      this.themeSignal.set(theme);
      this.applyTheme(theme);
    };

    media.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', listener));
  }
}
