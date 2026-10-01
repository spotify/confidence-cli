import { Box, Text } from 'ink';
import { Colors, Icons } from '../styles.js';

type DividerProps = {
  width?: number;
  color?: string;
};

export function Divider({ width = 40, color = Colors.border }: DividerProps) {
  return (
    <Box marginY={1}>
      <Text color={color}>{Icons.dash.repeat(width)}</Text>
    </Box>
  );
}
