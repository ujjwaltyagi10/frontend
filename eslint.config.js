// https://docs.expo.dev/guides/using-eslint/
const fs = require('fs');
const path = require('path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const features = fs
  .readdirSync(path.join(__dirname, 'src/features'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*'] },
  {
    settings: { 'import/resolver': { typescript: { project: './tsconfig.json' } } },
    rules: {
      // Architecture boundaries (see AGENTS.md → Project structure):
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // 1. A feature never imports another feature.
            ...features.map((f) => ({
              target: `./src/features/${f}`,
              from: './src/features',
              except: [`./${f}`],
              message:
                'Features must not import each other. Move shared code to components/, lib/ or stores/.',
            })),
            // 2. Shared layers never depend on features or routes.
            {
              target: [
                './src/components',
                './src/lib',
                './src/api',
                './src/stores',
                './src/theme',
                './src/config',
                './src/providers',
                './src/hooks',
              ],
              from: ['./src/features', './src/app'],
              message: 'Shared code must not depend on features or routes.',
            },
            // 3. Only the API client may load the mock server.
            {
              target: './src/!(api|mocks)/**/*',
              from: './src/mocks',
              message: 'Only src/api/client.ts may import mocks.',
            },
          ],
        },
      ],
      // 4. Outside a feature, import its public index only (`@/features/home`), never internals.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: "Import from the feature's index (e.g. '@/features/home'), not its internals.",
            },
          ],
        },
      ],
    },
  },
  {
    // jest.mock factories must use require().
    files: ['**/*.test.ts', '**/*.test.tsx', 'jest.setup.ts'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // Route files stay thin: they render a feature screen and nothing else.
    files: ['src/app/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/features/*/*'], message: "Import from the feature's index." },
            { group: ['@/api', '@/api/*'], message: 'Routes must not fetch data; do it in the feature.' },
          ],
        },
      ],
    },
  },
]);
