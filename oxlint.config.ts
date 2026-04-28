import loguxOxlintConfig from '@logux/oxc-configs/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [loguxOxlintConfig],
  ignorePatterns: ['dist/**'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
      rules: {
        'typescript/no-unsafe-type-assertion': 'off'
      }
    },
    {
      files: ['lib/colors.ts'],
      rules: {
        'no-underscore-dangle': 'off'
      }
    }
  ],
  rules: {
    'import/default': 'off',
    'no-control-regex': 'off'
  }
})
