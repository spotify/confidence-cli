export type IdeId = 'claude' | 'cursor' | 'codex';

export type OnboardingGoal = 'feature-flags' | 'session-recordings' | 'event-tracking';

export type PluginInstallationMethod = 'cli' | 'download';

export type ProviderId = 'eppo' | 'optimizely' | 'posthog' | 'statsig';

export type DetectedProvider = {
  id: ProviderId;
  name: string;
  skillName: string;
};
