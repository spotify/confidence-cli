import type { ProviderConfig } from '../types.js';

export const optimizelyProvider: ProviderConfig = {
  id: 'optimizely',
  name: 'Optimizely',
  skillName: 'migrate-optimizely',
  packages: {
    npm: ['@optimizely/optimizely-sdk', '@optimizely/react-sdk'],
    pypi: ['optimizely-sdk'],
  },
};
