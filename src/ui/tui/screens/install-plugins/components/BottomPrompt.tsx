import type { IdeId } from '@shared-kernel/types.js';
import { getIntegrations } from '@integrations/index.js';
import { PromptPanel } from '../../../components/PromptPanel.js';
import type { PluginPhase } from '../usePluginInstall.js';
import { ERROR_OPTIONS, type ErrorAction } from '../actions.js';
import { DefaultPrompt } from './DefaultPrompt.js';

const ALL_INTEGRATIONS = getIntegrations();

type BottomPromptProps = {
  phase: PluginPhase;
  detected: IdeId[];
  onSelect: (value: IdeId) => void;
  onError: (value: ErrorAction) => void;
};

export function BottomPrompt({ phase, detected, onSelect, onError }: BottomPromptProps) {
  switch (phase) {
    case 'choose-ide':
      return <DefaultPrompt onSelect={onSelect} />;

    case 'error':
      return (
        <PromptPanel
          mode="select"
          status="Agent setup failed."
          options={ERROR_OPTIONS}
          onSelect={onError}
        />
      );

    case 'already-installed': {
      const detectedSet = new Set(detected);
      const preferred = ALL_INTEGRATIONS.find((i) => detectedSet.has(i.id));

      if (!preferred) {
        return <DefaultPrompt onSelect={onSelect} />;
      }

      const rest = ALL_INTEGRATIONS.filter((i) => i.id !== preferred.id)
        .toSorted((a, b) => Number(detectedSet.has(b.id)) - Number(detectedSet.has(a.id)))
        .map((i) => ({ label: i.name, value: i.id }));

      return (
        <PromptPanel
          mode="select"
          status={`Confidence plugin detected for ${preferred.name}. Continue with it?`}
          options={[{ label: `Continue with ${preferred.name}`, value: preferred.id }, ...rest]}
          onSelect={onSelect}
        />
      );
    }

    case 'detecting':
    case 'installing':
    case 'installed':
      return null;

    default: {
      const _exhaustive: never = phase satisfies never;
      throw new Error(`Unhandled phase: ${_exhaustive}`);
    }
  }
}
