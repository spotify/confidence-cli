export type JsonObject = Record<string, unknown>;

export type IdeId = 'claude' | 'cursor' | 'codex';

export type OnboardingGoal = 'feature-flags' | 'session-recordings' | 'event-tracking';

export type PluginInstallationMethod = 'cli' | 'download';

export type PluginScope = 'project' | 'local' | 'global';

export type ProviderId = 'eppo' | 'optimizely' | 'posthog' | 'statsig';

export type DetectedProvider = {
  id: ProviderId;
  name: string;
  skillName: string;
};

export type AuthState = {
  status: 'idle' | 'pending' | 'authenticated' | 'failed';
  token?: string;
  refreshToken?: string;
  region?: 'EU' | 'US';
  workspace?: string;
  error?: string;
};
