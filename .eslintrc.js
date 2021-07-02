module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
  },
  extends: ['airbnb-base', 'prettier', 'eslint:recommended'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        singleQuote: true,
      },
    ],
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'no-restricted-syntax': 'off',
    'guard-for-in': 'off',
    'no-unused-expressions': 'off',
    'no-param-reassign': [
      2,
      {
        props: false,
      },
    ],
  },
};
