/// <reference types="vitest/globals" />

declare module 'ink-testing-library' {
  import type { ReactElement } from 'react';
  export function render(element: ReactElement): {
    lastFrame: () => string | undefined;
    frames: string[];
    unmount: () => void;
    stdin: { write: (data: string) => void };
    rerender: (element: ReactElement) => void;
  };
}
