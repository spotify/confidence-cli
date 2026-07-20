import { Box, Text } from 'ink';
import { Colors } from '../styles.js';
import { CONFIDENCE_SITE_URL } from '@lib/constants.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { useIsNarrow } from '../hooks/useIsNarrow.js';

export function TitleBar() {
  const { columns } = useTerminalSize();
  const narrow = useIsNarrow();

  const left = ' Confidence by Spotify';
  const right = CONFIDENCE_SITE_URL + ' ';
  const showUrl = !narrow;
  const fill = showUrl
    ? ' '.repeat(columns - left.length - right.length)
    : ' '.repeat(Math.max(0, columns - left.length));

  return (
    <Box>
      <Text backgroundColor={Colors.primary} color="#FFFFFF" bold>
        {left + fill + (showUrl ? right : '')}
      </Text>
    </Box>
  );
}
