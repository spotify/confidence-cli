import type { ProviderId } from '@shared-kernel/types.js';

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
