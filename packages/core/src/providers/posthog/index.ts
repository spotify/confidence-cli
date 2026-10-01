import type { ProviderConfig } from '../types.js';

export const posthogProvider: ProviderConfig = {
  id: 'posthog',
  name: 'PostHog',
  skillName: 'migrate-posthog',
  packages: {
    npm: ['posthog-js', 'posthog-node'],
    pypi: ['posthog'],
  },
};
