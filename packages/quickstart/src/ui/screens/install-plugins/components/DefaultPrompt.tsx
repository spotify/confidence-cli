import { PromptPanel } from '@ui/components/index.js';
import type { IdeId } from '@spotify-confidence/shared-kernel';
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
