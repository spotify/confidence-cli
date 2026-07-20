import type { ReactNode } from 'react';
import { Box } from 'ink';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

const NARROW_THRESHOLD = 60;

type TwoColumnLayoutProps = {
  left: ReactNode;
  right: ReactNode;
};

export function TwoColumnLayout({ left, right }: TwoColumnLayoutProps) {
  const { columns } = useTerminalSize();
  const narrow = columns < NARROW_THRESHOLD;

  if (narrow) {
    return (
      <Box flexDirection="column" flexGrow={1}>
        <Box flexDirection="column" flexGrow={1}>
          {left}
        </Box>
        <Box flexDirection="column" marginTop={1}>
          {right}
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="row" flexGrow={1}>
      <Box flexDirection="column" flexGrow={1} flexBasis="70%" paddingRight={2}>
        {left}
      </Box>
      <Box flexDirection="column" flexBasis="30%" flexShrink={0}>
        {right}
      </Box>
    </Box>
  );
}
