import base from './index.js';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  ...base,
  reactHooks.configs.flat['recommended-latest'],
  {
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/incompatible-library': 'error',
      'react-hooks/unsupported-syntax': 'error',
    },
  },
];
