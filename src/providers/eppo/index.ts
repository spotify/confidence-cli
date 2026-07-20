import type { ProviderConfig } from '../types.js';

export const eppoProvider: ProviderConfig = {
  id: 'eppo',
  name: 'Eppo',
  skillName: 'migrate-eppo',
  packages: {
    npm: ['@eppo/js-client-sdk', '@eppo/node-server-sdk', '@eppo/react-native-sdk'],
    pypi: ['eppo-server-sdk'],
  },
};
