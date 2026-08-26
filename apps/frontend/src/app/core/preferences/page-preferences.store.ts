import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { SUPPORTED_LANGUAGES } from '../language/constants';
import type { Language } from '../language/types/language.types';
import { SUPPORTED_THEMES } from '../theme/constants';
import type { Theme } from '../theme/types/theme.types';
import { PAGE_PREFERENCES_STORAGE_KEY } from './constants';
import type { PagePreferences } from './types/page-preferences.types';

@Injectable({ providedIn: 'root' })
export class PagePreferencesStore {
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

  public getRaw(): Partial<PagePreferences> {
    return this.readStored();
  }

  public set(partial: Partial<PagePreferences>): void {
    if (!this.isBrowser) {
      return;
    }

    const next: Partial<PagePreferences> = { ...this.readStored(), ...partial };

    try {
      localStorage.setItem(PAGE_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      void error;
    }
  }

  private readStored(): Partial<PagePreferences> {
    if (!this.isBrowser) {
      return {};
    }

    try {
      const raw = localStorage.getItem(PAGE_PREFERENCES_STORAGE_KEY);
      return raw === null ? {} : this.toPartialPreferences(JSON.parse(raw));
    } catch {
      return {};
    }
  }

  private toPartialPreferences(value: unknown): Partial<PagePreferences> {
    if (typeof value !== 'object' || value === null) {
      return {};
    }

    const record = value as Record<string, unknown>;
    const theme = SUPPORTED_THEMES.includes(record['theme'] as Theme) ? (record['theme'] as Theme) : undefined;
    const language = SUPPORTED_LANGUAGES.includes(record['language'] as Language)
      ? (record['language'] as Language)
      : undefined;

    return {
      ...(theme !== undefined && { theme }),
      ...(language !== undefined && { language }),
    };
  }
}
