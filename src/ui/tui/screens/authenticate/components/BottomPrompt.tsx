import { PromptPanel } from '../../../components/PromptPanel.js';
import type { AuthPhase } from '../useAuthFlow.js';
import { EXISTING_OPTIONS, FAIL_OPTIONS } from '../actions.js';

type BottomPromptProps = {
  phase: AuthPhase;
  workspace: string | null;
  onUseExisting: () => void;
  onLogin: () => void;
  onRetry: () => void;
  onQuit: () => void;
  onCancelBrowser: () => void;
};

export function BottomPrompt({
  phase,
  workspace,
  onUseExisting,
  onLogin,
  onRetry,
  onQuit,
  onCancelBrowser,
}: BottomPromptProps) {
  switch (phase) {
    case 'has-existing':
      return (
        <PromptPanel
          mode="select"
          status={`Found existing account${workspace ? ` (${workspace})` : ''}. What would you like to do?`}
          options={EXISTING_OPTIONS}
          onSelect={(value) => {
            if (value === 'use-existing') onUseExisting();
            else onLogin();
          }}
        />
      );
    case 'choose-action':
      return (
        <PromptPanel
          mode="select"
          status="We'll open your browser to sign in. Continue?"
          options={[{ label: 'Sign in to a Confidence account', value: 'login' }]}
          onSelect={onLogin}
        />
      );
    case 'failed':
      return (
        <PromptPanel
          mode="select"
          status="Authentication failed."
          options={FAIL_OPTIONS}
          onSelect={(value) => {
            if (value === 'retry') onRetry();
            else onQuit();
          }}
        />
      );
    case 'waiting-browser':
      return (
        <PromptPanel
          mode="info"
          status="Waiting for browser authentication..."
          onCancel={onCancelBrowser}
        />
      );
    case 'checking':
    case 'authenticated':
      return null;
    default: {
      const _exhaustive: never = phase satisfies never;
      throw new Error(`Unhandled phase: ${_exhaustive}`);
    }
  }
}
