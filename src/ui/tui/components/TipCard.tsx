import { Box, Text } from 'ink';
import { Colors, Emoji, Icons } from '../styles.js';
import { TerminalLink } from './TerminalLink.js';
import type { Tip } from '../lib/tips.js';

type TipCardProps = {
  tip: Tip;
};

export function TipCard({ tip }: TipCardProps) {
  return (
    <Box
      flexDirection="column"
      paddingLeft={1}
      borderStyle="single"
      borderColor={Colors.border}
      borderDimColor
      overflow="hidden"
    >
      <Text color={Colors.accent} bold>
        {Emoji.tip} {tip.title}
      </Text>
      <Box marginY={1}>
        <Text color={Colors.muted}>{tip.body}</Text>
      </Box>
      <Box>
        <TerminalLink url={tip.url}>{`Read more ${Icons.arrowRight}`}</TerminalLink>
      </Box>
    </Box>
  );
}
