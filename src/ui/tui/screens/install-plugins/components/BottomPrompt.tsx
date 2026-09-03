import type { IdeId } from '@shared-kernel/types.js';
import { getIntegrations } from '@integrations/index.js';
import { PromptPanel } from '../../../components/PromptPanel.js';
import type { PluginPhase } from '../usePluginInstall.js';
import {
  IDE_SELECT_OPTIONS,
  ERROR_OPTIONS,
  type IdeSelectValue,
  type DetectedSelectValue,
  type ErrorAction,
} from '../actions.js';

const ALL_INTEGRATIONS = getIntegrations();

type BottomPromptProps = {
  phase: PluginPhase;
  detected: IdeId[];
  onIdeSelect: (value: IdeSelectValue) => void;
  onDetectedSelect: (value: DetectedSelectValue) => void;
  onError: (value: ErrorAction) => void;
};

export function BottomPrompt({
  phase,
  detected,
  onIdeSelect,
  onDetectedSelect,
  onError,
}: BottomPromptProps) {
  switch (phase) {
    case 'choose-ide':
      return (
        <PromptPanel
          mode="select"
          status="Which CLI agent would you like to use?"
          options={IDE_SELECT_OPTIONS}
          onSelect={onIdeSelect}
        />
      );
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
      const otherOptions = ALL_INTEGRATIONS.filter((i) => i.id !== preferred?.id)
        .toSorted((a, b) => Number(detectedSet.has(b.id)) - Number(detectedSet.has(a.id)))
        .map((i) => ({
          label: i.name,
          value: i.id,
        }));

      return (
        <PromptPanel
          mode="select"
          status={`Confidence plugin detected for ${preferred?.name}. Continue with this agent tool?`}
          options={[
            { label: `Continue with ${preferred?.name}`, value: 'continue' },
            ...otherOptions,
          ]}
          onSelect={onDetectedSelect}
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
