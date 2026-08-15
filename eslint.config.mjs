import nx from '@nx/eslint-plugin';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist', '**/out-tsc', '**/.angular', '**/.nx', '**/node_modules'],
  },

  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],

  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'scope:client',
              onlyDependOnLibsWithTags: ['scope:client', 'scope:shared'],
            },
            { sourceTag: 'scope:api', onlyDependOnLibsWithTags: ['scope:api', 'scope:shared'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },

            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:util', 'type:model', 'type:dto'],
            },
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: [
                'type:app',
                'type:ui',
                'type:data-access',
                'type:util',
                'type:model',
                'type:dto',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:model', 'type:dto'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:util', 'type:model', 'type:dto'],
            },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util', 'type:model'] },
            { sourceTag: 'type:dto', onlyDependOnLibsWithTags: ['type:model', 'type:dto'] },
            { sourceTag: 'type:model', onlyDependOnLibsWithTags: ['type:model'] },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/require-array-sort-compare': ['error', { ignoreStringArrays: true }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'property'],

      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  {
    files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts', '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-implicit-coercion': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-template': 'error',
    },
  },

  prettierRecommended,
);
