import { SDK_OPTIONS } from '@lib/sdk-options.js';
import { PromptPanel } from '../../../components/PromptPanel.js';
import type { OnboardingPhase } from '../useOnboardingProcess.js';
import { CONFIRM_OPTIONS, ERROR_OPTIONS } from '../actions.js';

type OnboardingBottomPromptProps = {
  phase: OnboardingPhase;
  selectSdk: (id: string, label: string) => void;
  onConfirmStart: () => void;
  onConfirmSkip: () => void;
  onSkip: () => void;
  onRetry: () => void;
  onCancel: () => void;
};

export function OnboardingBottomPrompt({
  phase,
  selectSdk,
  onConfirmStart,
  onConfirmSkip,
  onSkip,
  onRetry,
  onCancel,
}: OnboardingBottomPromptProps) {
  switch (phase) {
    case 'confirm':
      return (
        <PromptPanel
          mode="select"
          status="Start onboarding?"
          options={CONFIRM_OPTIONS}
          onSelect={(value) => {
            if (value === 'skip') return onConfirmSkip();
            onConfirmStart();
          }}
        />
      );
    case 'choose-sdk':
      return (
        <PromptPanel
          mode="select"
          status="Which SDK should we use for the sample app?"
          options={[
            ...SDK_OPTIONS.map((sdk) => ({ label: sdk.label, value: sdk.id })),
            { label: 'Skip', value: 'skip' },
          ]}
          onSelect={(value) => {
            if (value === 'skip') return onSkip();
            const selected = SDK_OPTIONS.find((s) => s.id === value);
            if (selected) selectSdk(selected.id, selected.label);
          }}
        />
      );
    case 'onboarding':
      return <PromptPanel mode="info" status="This usually takes 3–5 min." onCancel={onCancel} />;
    case 'error':
      return (
        <PromptPanel
          mode="select"
          status="Onboarding encountered an error."
          options={ERROR_OPTIONS}
          onSelect={(value) => (value === 'retry' ? onRetry() : onSkip())}
        />
      );
    case 'detecting':
    case 'done':
      return null;
    default: {
      const _exhaustive: never = phase satisfies never;
      throw new Error(`Unhandled phase: ${_exhaustive}`);
    }
  }
}
