export type ProviderId = 'eppo' | 'optimizely' | 'posthog' | 'statsig';

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

export type DetectedProvider = Pick<ProviderConfig, 'id' | 'name' | 'skillName'>;
