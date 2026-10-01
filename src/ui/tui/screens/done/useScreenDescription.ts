import { useSession } from '../../store.js';
import { useIdeIdName } from './useIdeIdName.js';
import { useOnboardingOutcome } from './useOnboardingOutcome.js';

export function useScreenDescription() {
  const { detectedProviders, pluginTargets } = useSession();

  const outcome = useOnboardingOutcome();
  const ideName = useIdeIdName();
  const hasPlugins = pluginTargets.length > 0;
  const hasProviders = detectedProviders.length > 0;

  if (outcome === 'skipped')
    return 'You can always use Confidence AI plugin to run onboarding yourself later.';
  if (outcome === 'cancelled')
    return 'Onboarding was stopped before it finished. Your project may be partially set up.';
  if (outcome === 'failed')
    return 'Onboarding hit an error. Your project may be partially set up — re-run the wizard or ask your agent to finish.';
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
