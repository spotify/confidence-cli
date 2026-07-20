import { Box, Text } from 'ink';
import { Colors, Icons } from '../styles.js';
import type { StatusLine } from '../lib/status-line.js';

type StatusFeedProps = {
  lines: StatusLine[];
  maxVisible: number;
};

const STATUS_COLOR: Record<StatusLine['type'], string | undefined> = {
  info: undefined,
  success: Colors.success,
  error: Colors.error,
  blank: undefined,
};

const STATUS_ICON: Record<StatusLine['type'], string> = {
  success: Icons.check,
  error: Icons.cross,
  info: Icons.arrow,
  blank: '',
};

export function StatusFeed({ lines, maxVisible }: StatusFeedProps) {
  const hiddenCount = lines.length - maxVisible;

  return (
    <>
      {hiddenCount > 0 && (
        <Box gap={1}>
          <Text color={Colors.muted}>
            {Icons.plus} {hiddenCount} earlier {hiddenCount === 1 ? 'step' : 'steps'}
          </Text>
        </Box>
      )}
      {lines.slice(-maxVisible).map((line, i) =>
        line.type === 'blank' ? (
          <Box key={i}>
            <Text> </Text>
          </Box>
        ) : (
          <Box key={i} gap={1}>
            <Text color={STATUS_COLOR[line.type]}>{STATUS_ICON[line.type]}</Text>
            <Text color={STATUS_COLOR[line.type]}>{line.text}</Text>
          </Box>
        ),
      )}
    </>
  );
}
