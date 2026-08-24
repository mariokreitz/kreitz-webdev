import type { Language } from '../types/language.types';

export const LANGUAGE_STORAGE_KEY = 'kwd-language';
export const DEFAULT_LANGUAGE: Language = 'en';
export const SUPPORTED_LANGUAGES: readonly Language[] = ['de', 'en'];
export const I18N_ASSET_PREFIX = '/assets/i18n/';
