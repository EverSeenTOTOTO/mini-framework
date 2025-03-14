module.exports = {
  env: {
    es2021: true,
    node: true,
    'jest/globals': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    project: `${__dirname}/tsconfig.eslint.json`,
  },
  plugins: [
    '@typescript-eslint',
    'jest',
  ],
  rules: {
    'max-len': 'off',
    'no-console': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
    'no-nested-ternary': 'off',
    'arrow-body-style': 'off',
    'import/extensions': 'off',
    'object-curly-newline': 'off',
    'no-restricted-syntax': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': 'warn',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
