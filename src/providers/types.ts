import type { ProviderId, DetectedProvider } from '@shared-kernel/types.js';

export type { ProviderId, DetectedProvider };

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  skillName: string;
  packages: {
    npm?: string[];
    pypi?: string[];
    gomod?: string[];
  };
};
