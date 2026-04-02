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
    }
  ],
  rules: {
    'import/default': 'off',
    'no-control-regex': 'off',
    // TODO: remove on next @logux/oxc-configs release
    'unicorn/require-post-message-target-origin': 'off'
  }
})
