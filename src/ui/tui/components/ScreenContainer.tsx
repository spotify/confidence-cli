import { useSession } from '../store.js';
import type { ReactNode } from 'react';
import { Box } from 'ink';
import { ScreenId } from '@lib/session.js';
import { DebugLog } from '../components/DebugLog.js';
import { TitleBar } from '../components/TitleBar.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

type ScreenMap = {
  [key: string]: ReactNode;
};

type ScreenContainerProps = {
  screens: ScreenMap;
};

export function ScreenContainer({ screens }: ScreenContainerProps) {
  const session = useSession();
  const { rows } = useTerminalSize();

  const screenId = session.currentScreen;
  const screen = screens[screenId] ?? screens[ScreenId.Welcome];
  return (
    <>
      <DebugLog />

      <Box flexDirection="column" height={rows}>
        <TitleBar />
        <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
          {screen}
        </Box>
      </Box>
    </>
  );
}
