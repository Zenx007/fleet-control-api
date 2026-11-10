import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'object-shorthand': 'error',
      'no-console': ['error', { allow: ['log', 'error'] }],
    },
  },
  {
    files: ['src/application/ports/**/*.js'],
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
];
