import { useSession } from '../../store.js';
import { useChosenIdeName } from './useChosenIdeName.js';
import { useSkippedOnboarding } from './useSkippedOnboarding.js';

export function useScreenDescription() {
  const { detectedProviders, pluginTargets } = useSession();

  const skipped = useSkippedOnboarding();
  const ideName = useChosenIdeName();
  const hasPlugins = pluginTargets.length > 0;
  const hasProviders = detectedProviders.length > 0;

  if (skipped) return 'You can always use Confidence AI plugin to run onboarding yourself later.';
  if (!ideName) return 'Check the quickstart report below for next steps.';
  if (!hasPlugins) return `Continue working in ${ideName} to make things even better.`;

  const lines = [
    `We've taught ${ideName} Confidence skills—try them out with slash commands.`,

    hasProviders
      ? `For example, run /${detectedProviders[0].skillName} to migrate existing feature flags to Confidence.`
      : null,
  ];

  return lines.filter(Boolean).join('\n');
}
