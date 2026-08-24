import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal, type Signal, type WritableSignal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './constants';
import type { Language } from './types/language.types';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly languageSignal: WritableSignal<Language> = signal(DEFAULT_LANGUAGE);
  public readonly language: Signal<Language> = this.languageSignal.asReadonly();

  public async initialize(): Promise<void> {
    this.translate.addLangs([...SUPPORTED_LANGUAGES]);
    await this.use(this.resolveInitialLanguage());
  }

  public async use(language: Language): Promise<void> {
    await firstValueFrom(this.translate.use(language));
    this.languageSignal.set(language);
    this.persist(language);

    if (this.isBrowser) {
      document.documentElement.lang = language;
    }
  }

  private resolveInitialLanguage(): Language {
    return this.readStoredLanguage() ?? this.detectBrowserLanguage();
  }

  private readStoredLanguage(): Language | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return this.toSupportedLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
    } catch {
      return null;
    }
  }

  private detectBrowserLanguage(): Language {
    return this.toSupportedLanguage(this.translate.getBrowserLang()) ?? DEFAULT_LANGUAGE;
  }

  private toSupportedLanguage(value: string | null | undefined): Language | null {
    return SUPPORTED_LANGUAGES.find((language) => language === value) ?? null;
  }

  private persist(language: Language): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // no-op
    }
  }
}
