import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/generated/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      '.tools/**',
      '.pnpm-store/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: globals.node } },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['packages/block-engine/src/**/*.ts'],
    languageOptions: {
      globals: {
        ...Object.fromEntries(
          Object.keys(globals.node).map((key) => [key, 'off']),
        ),
      },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react/*',
            'blockly',
            'blockly/*',
            '@prisma/*',
            '@jyboia/shared',
            'node:*',
          ],
        },
      ],
    },
  },
  prettier,
];
