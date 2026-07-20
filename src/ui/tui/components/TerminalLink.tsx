import { Text } from 'ink';
import { Colors } from '../styles.js';

type TerminalLinkProps = {
  url: string;
  children: string;
};

const LINK_OPEN = (url: string) => `\x1b]8;;${url}\x07`;
const LINK_CLOSE = '\x1b]8;;\x07';

export function TerminalLink({ url, children }: TerminalLinkProps) {
  return (
    <Text color={Colors.primary} bold>
      {LINK_OPEN(url)}[{children}]{LINK_CLOSE}
    </Text>
  );
}
