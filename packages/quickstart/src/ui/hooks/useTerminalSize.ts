import { useState, useEffect } from 'react';
import { useStdout } from 'ink';

export type TerminalSize = {
  columns: number;
  rows: number;
};

export function useTerminalSize(): TerminalSize {
  const { stdout } = useStdout();

  const [size, setSize] = useState<TerminalSize>({
    columns: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24,
  });

  useEffect(
    function syncSizeOnResize() {
      if (!stdout) return;

      function onResize() {
        setSize({
          columns: stdout!.columns,
          rows: stdout!.rows,
        });
      }

      stdout.on('resize', onResize);
      return () => {
        stdout.off('resize', onResize);
      };
    },
    [stdout],
  );

  return size;
}
