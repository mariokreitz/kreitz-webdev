import { defineConfig } from '@verbatra/cli';

export default defineConfig({
  sourceLocale: 'en',
  targetLocales: ['de'],
  format: 'ngx-translate-json',
  files: {
    pattern: 'apps/portal/public/assets/i18n/{locale}.json',
  },
  provider: {
    id: 'anthropic',
    options: {
      model: 'claude-sonnet-4-6',
      maxTokens: 4096,
    },
  },
});
