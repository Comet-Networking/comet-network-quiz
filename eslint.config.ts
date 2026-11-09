import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.tanstack/**',
      '.cache/**',
      'coverage/**',
      'src/client/routeTree.gen.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx,cjs}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: false },
      ],
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    files: ['src/client/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/server/**'],
              allowTypeImports: true,
              message:
                'Only type imports from the server belong in the client.',
            },
            {
              group: ['**/quizzes/**'],
              message: 'Quiz files contain answer keys and are server-only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/client/routes/**/*.tsx'],
    rules: {
      // TanStack's Vite plugin handles hot updates of route-module exports.
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['Route'] },
      ],
    },
  },
  {
    files: ['src/server/**/*.ts', 'tests/**/*.ts', '*.config.ts'],
    languageOptions: { globals: globals.builtin },
  },
  {
    files: ['*.config.cjs'],
    languageOptions: { globals: globals.node },
  },
  // Prettier owns formatting; ESLint owns correctness and code quality.
  prettier,
);
