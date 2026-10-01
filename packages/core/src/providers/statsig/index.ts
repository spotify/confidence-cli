import type { ProviderConfig } from '../types.js';

export const statsigProvider: ProviderConfig = {
  id: 'statsig',
  name: 'Statsig',
  skillName: 'migrate-statsig',
  packages: {
    npm: ['@statsig/js-client', '@statsig/react-sdk', 'statsig-js', 'statsig-node'],
    pypi: ['statsig'],
  },
};
