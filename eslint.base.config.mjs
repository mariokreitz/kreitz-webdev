import nx from '@nx/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import baseConfig from './eslint.config.mjs';

const angularSelectorRules = ({ componentPrefix, directivePrefix }) => ({
  '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: directivePrefix, style: 'camelCase' }],
  '@angular-eslint/component-selector': ['error', { type: 'element', prefix: componentPrefix, style: 'kebab-case' }],
});

const angularTypescriptRules = {
  '@angular-eslint/consistent-component-styles': 'error',
  '@angular-eslint/inject-at-top': 'error',
  '@angular-eslint/no-async-lifecycle-method': 'error',
  '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
  '@angular-eslint/no-implicit-take-until-destroyed': 'error',
  '@angular-eslint/no-pipe-impure': 'error',
  '@angular-eslint/no-uncalled-signals': 'error',
  '@angular-eslint/prefer-output-emitter-ref': 'error',
  '@angular-eslint/prefer-output-readonly': 'error',
  '@angular-eslint/prefer-signals': 'error',
  '@angular-eslint/relative-url-prefix': 'error',
  '@angular-eslint/require-lifecycle-on-prototype': 'error',
  '@angular-eslint/sort-lifecycle-methods': 'error',
  '@angular-eslint/use-component-selector': 'error',
  '@angular-eslint/use-lifecycle-interface': 'error',
};

const angularTemplateRules = {
  '@angular-eslint/template/attributes-order': 'error',
  '@angular-eslint/template/button-has-type': 'error',
  '@angular-eslint/template/no-any': 'error',
  '@angular-eslint/template/no-duplicate-attributes': 'error',
  '@angular-eslint/template/no-empty-control-flow': 'error',
  '@angular-eslint/template/no-inline-styles': ['error', { allowNgStyle: true }],
  '@angular-eslint/template/no-interpolation-in-attributes': 'error',
  '@angular-eslint/template/no-nested-tags': 'error',
  '@angular-eslint/template/no-positive-tabindex': 'error',
  '@angular-eslint/template/prefer-at-else': 'error',
  '@angular-eslint/template/prefer-at-empty': 'error',
  '@angular-eslint/template/prefer-built-in-pipes': 'error',
  '@angular-eslint/template/prefer-contextual-for-variables': 'error',
  '@angular-eslint/template/prefer-ngsrc': 'error',
  '@angular-eslint/template/prefer-self-closing-tags': 'error',
  '@angular-eslint/template/prefer-static-string-properties': 'error',
  '@angular-eslint/template/prefer-template-literal': 'error',
  '@angular-eslint/template/require-switch-default': 'error',
};

export function angularAppConfig({ componentPrefix, directivePrefix }) {
  return [
    {
      ignores: ['**/src/index.html'],
    },

    ...nx.configs['flat/angular'],
    ...nx.configs['flat/angular-template'],
    ...baseConfig,

    {
      files: ['**/*.ts'],
      rules: {
        ...angularSelectorRules({ componentPrefix, directivePrefix }),
        ...angularTypescriptRules,
        '@angular-eslint/use-injectable-provided-in': 'error',
      },
    },

    {
      files: ['**/*.html'],
      rules: angularTemplateRules,
    },
  ];
}

export function angularLibConfig({ componentPrefix, directivePrefix }) {
  return [
    ...nx.configs['flat/angular'],
    ...nx.configs['flat/angular-template'],
    ...baseConfig,

    {
      files: ['**/*.ts'],
      rules: {
        ...angularSelectorRules({ componentPrefix, directivePrefix }),
        ...angularTypescriptRules,
      },
    },

    {
      files: ['**/*.html'],
      rules: angularTemplateRules,
    },
  ];
}

export function playwrightE2eConfig() {
  return [
    playwright.configs['flat/recommended'],
    ...baseConfig,

    {
      files: ['**/*.ts', '**/*.js'],
      rules: {
        'playwright/expect-expect': 'error',
        'playwright/no-conditional-in-test': 'error',
        'playwright/no-focused-test': 'error',
        'playwright/no-skipped-test': 'warn',
        'playwright/prefer-web-first-assertions': 'error',
        'playwright/require-top-level-describe': 'off',
      },
    },
  ];
}
