import type { IdeIntegration } from '@integrations/index.js';
import { PromptPanel } from '../../../components/PromptPanel.js';
import type { PluginPhase } from '../usePluginInstall.js';
import {
  IDE_SELECT_OPTIONS,
  ERROR_OPTIONS,
  type IdeSelectValue,
  type DetectedSelectValue,
  type ErrorAction,
} from '../actions.js';

type BottomPromptProps = {
  phase: PluginPhase;
  preferredLabel: string | null;
  otherIntegrations: IdeIntegration[];
  onIdeSelect: (value: IdeSelectValue) => void;
  onDetectedSelect: (value: DetectedSelectValue) => void;
  onError: (value: ErrorAction) => void;
};

export function BottomPrompt({
  phase,
  preferredLabel,
  otherIntegrations,
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
          status="Plugin installation failed."
          options={ERROR_OPTIONS}
          onSelect={onError}
        />
      );
    case 'already-installed': {
      const otherOptions = otherIntegrations.map((i) => ({
        label: i.name,
        value: i.id,
      }));

      return (
        <PromptPanel
          mode="select"
          status={`Confidence plugin detected for ${preferredLabel}. Continue with this agent tool?`}
          options={[
            { label: `Continue with ${preferredLabel}`, value: 'continue' },
            ...otherOptions,
            { label: 'Skip (install manually later)', value: 'skip' },
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
