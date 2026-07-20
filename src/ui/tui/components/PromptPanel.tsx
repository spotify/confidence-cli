import { Box, Text, useInput } from 'ink';
import { Select, TextInput } from '@inkjs/ui';
import { Colors } from '../styles.js';

export type PromptOption = {
  label: string;
  value: string;
};

type PromptPanelBase = {
  onCancel?: () => void;
};

type PromptPanelSelectProps = PromptPanelBase & {
  mode: 'select';
  status: string;
  options: PromptOption[];
  onSelect: (value: string) => void;
};

type PromptPanelInputProps = PromptPanelBase & {
  mode: 'input';
  status: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
};

type PromptPanelInfoProps = PromptPanelBase & {
  mode: 'info';
  status: string;
};

type PromptPanelProps = PromptPanelSelectProps | PromptPanelInputProps | PromptPanelInfoProps;

const MAX_VISIBLE_OPTIONS = 8;

export function PromptPanel(props: PromptPanelProps) {
  useInput((_input, key) => {
    if (key.escape && props.onCancel) {
      props.onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      borderDimColor
      borderColor={Colors.border}
    >
      <Box marginBottom={1}>
        <Text>{props.status}</Text>
      </Box>

      {props.mode !== 'info' && (
        <Box marginBottom={1}>
          {props.mode === 'select' && (
            <Select
              options={props.options}
              onChange={props.onSelect}
              visibleOptionCount={Math.min(props.options.length, MAX_VISIBLE_OPTIONS)}
            />
          )}
          {props.mode === 'input' && (
            <TextInput placeholder={props.placeholder} onSubmit={props.onSubmit} />
          )}
        </Box>
      )}

      <Box flexDirection="row" gap={3}>
        {props.mode === 'select' && props.options.length > 1 && (
          <Box gap={1}>
            <Text color={Colors.accent} bold>
              ↑↓
            </Text>
            <Text color={Colors.muted}>navigate</Text>
          </Box>
        )}
        {props.mode !== 'info' && (
          <Box gap={1}>
            <Text color={Colors.accent} bold>
              enter
            </Text>
            <Text color={Colors.muted}>{props.mode === 'input' ? 'submit' : 'confirm'}</Text>
          </Box>
        )}
        {props.onCancel && (
          <Box gap={1}>
            <Text color={Colors.accent} bold>
              esc
            </Text>
            <Text color={Colors.muted}>cancel</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
