import { defineConfig } from '@verbatra/cli';

export default defineConfig({
  sourceLocale: 'en',
  targetLocales: ['de'],
  format: 'ngx-translate-json',
  files: {
    pattern: 'apps/portal/public/assets/i18n/{locale}.json',
  },
  provider: {
    id: 'gemini',
    options: {
      model: 'gemini-2.5-flash',
      maxOutputTokens: 8192,
    },
  },
  tone: 'informal',
});
