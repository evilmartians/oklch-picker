import loguxTsConfig from '@logux/eslint-config/ts'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  { ignores: ['dist/'] },
  ...loguxTsConfig,
  {
    rules: {
      'no-control-regex': 'off'
    }
  },
  {
    files: ['**/worker.ts'],
    rules: {
      'import/extensions': 'off'
    }
  },
  {
    files: ['lib/**', 'view/**', 'stores/**'],
    rules: {
      'n/no-unsupported-features/node-builtins': 'off'
    }
  }
]
