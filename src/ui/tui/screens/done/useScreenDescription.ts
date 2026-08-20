import { getIntegration } from '@integrations/index.js';
import { useSession } from '../../store.js';

export function useScreenDescription() {
  const { codeChanges, ide, detectedProviders, installedPlugins } = useSession();

  const skipped = codeChanges.length === 0;
  const ideName = ide ? getIntegration(ide).name : null;
  const hasPlugins = installedPlugins.length > 0;
  const hasProviders = detectedProviders.length > 0;

  if (skipped) return 'You can always use Confidence AI plugin to run onboarding yourself later.';
  if (!ideName) return 'Check the quickstart report below for next steps.';
  if (!hasPlugins) return `Continue working in ${ideName} to make things even better.`;

  const lines = [
    `We've taught ${ideName} Confidence skills—try them out with slash commands.`,

    hasProviders
      ? `For example, run /migrate-${detectedProviders[0].id} to migrate existing feature flags to Confidence.`
      : null,
  ];

  return lines.filter(Boolean).join('\n');
}
