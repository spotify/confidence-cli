import { useState } from 'react';
import { detectProviders, type DetectedProvider } from '@providers/index.js';
import { useSyncProviders } from './useSyncProviders.js';
import { useSession } from '../../store.js';
import type { ChosenIde, WizardSession } from '@lib/session.js';
import { BROWSER_PLATFORMS } from '@lib/sdk-options.js';

export type Phase = 'select-goal' | 'select-migration' | 'done';

export type InitialGoalSelection = {
  phase: Phase;
  providers: DetectedProvider[];
  supportsRecordings: boolean;
};

export function useInitialGoalSelection(): InitialGoalSelection {
  const session = useSession();
  const [resolved] = useState(() => resolveInitialGoalSelection(session));

  useSyncProviders(resolved.providers);

  return resolved;
}

function resolveInitialGoalSelection(session: WizardSession): InitialGoalSelection {
  const supportsRecordings = !!session.framework && BROWSER_PLATFORMS.has(session.framework);
  const providers = resolveProviders(session);

  const phase = supportsRecordings
    ? 'select-goal'
    : canOfferMigration(providers, session.installedPlugins)
      ? 'select-migration'
      : 'done';

  return { phase, providers, supportsRecordings };
}

function resolveProviders(session: WizardSession): DetectedProvider[] {
  return session.detectedProviders.length > 0
    ? session.detectedProviders
    : !session.dryRun
      ? detectProviders(session.projectDir)
      : [];
}

export function canOfferMigration(
  providers: DetectedProvider[],
  installedPlugins: ChosenIde[],
): boolean {
  return providers.length > 0 && installedPlugins.length > 0;
}
