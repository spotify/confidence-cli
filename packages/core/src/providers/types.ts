import type { ProviderId } from '@spotify-confidence/shared-kernel';

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
