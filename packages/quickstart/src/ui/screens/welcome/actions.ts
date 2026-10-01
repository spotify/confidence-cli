import type { PromptOption } from '../../components/PromptPanel.js';

export type MenuAction = 'start' | 'framework' | 'about' | 'quit';

export const MENU_OPTIONS: PromptOption<MenuAction>[] = [
  { label: 'Start setup', value: 'start' },
  { label: 'Change framework', value: 'framework' },
  { label: 'About Confidence', value: 'about' },
  { label: 'Quit', value: 'quit' },
];

export const MENU_OPTIONS_NO_FRAMEWORK: PromptOption<MenuAction>[] = [
  { label: 'Select framework', value: 'framework' },
  { label: 'About Confidence', value: 'about' },
  { label: 'Quit', value: 'quit' },
];
