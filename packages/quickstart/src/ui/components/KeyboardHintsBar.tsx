import { Box, Text } from 'ink';
import { Colors } from '../styles.js';

export type KeyHint = {
  key: string;
  label: string;
};

type KeyboardHintsBarProps = {
  hints: KeyHint[];
};

export function KeyboardHintsBar({ hints }: KeyboardHintsBarProps) {
  return (
    <Box flexDirection="row" gap={2}>
      {hints.map((hint) => (
        <Box key={hint.key} flexDirection="row" gap={1}>
          <Text color={Colors.accent} bold>
            {hint.key}
          </Text>
          <Text color={Colors.muted}>{hint.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
