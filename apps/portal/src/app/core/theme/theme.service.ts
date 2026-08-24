import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal, type WritableSignal } from '@angular/core';
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from './constants';
import type { Theme } from './types/theme.types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  public readonly theme: WritableSignal<Theme>;
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  constructor() {
    this.theme = signal<Theme>(this.resolveInitialTheme());

    if (this.isBrowser) {
      this.watchSystemPreference();
    }
  }

  public toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  public setTheme(theme: Theme): void {
    this.theme.set(theme);

    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // no-op
    }

    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  }

  private resolveInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'dark';
    }

    const stored = this.readStoredTheme();

    if (stored) {
      return stored;
    }

    return this.prefersDark() ? 'dark' : 'light';
  }

  private readStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  }

  private prefersDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private watchSystemPreference(): void {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent): void => {
      if (this.readStoredTheme()) {
        return;
      }

      this.theme.set(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', listener));
  }
}
