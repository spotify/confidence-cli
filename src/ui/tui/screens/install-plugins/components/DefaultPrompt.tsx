import { PromptPanel } from '@ui/tui/components/index.js';
import type { IdeId } from '@shared-kernel/types.js';
import { IDE_SELECT_OPTIONS } from '../actions.js';

type DefaultPromptProps = {
  onSelect: (value: IdeId) => void;
};

export function DefaultPrompt({ onSelect }: DefaultPromptProps) {
  return (
    <PromptPanel
      mode="select"
      status="Which CLI agent would you like to use?"
      options={IDE_SELECT_OPTIONS}
      onSelect={onSelect}
    />
  );
}
