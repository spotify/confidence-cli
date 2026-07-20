import React from 'react';
import { render } from 'ink';
import { store, $session, type StoreOptions } from './store.js';
import { App } from './App.js';
import { initTelemetry } from '@lib/telemetry.js';

export async function startTui(opts?: StoreOptions) {
  store.init(opts);
  initTelemetry({ sessionId: $session.get().sessionId });

  const debug = $session.get().debug;

  const instance = render(React.createElement(App), {
    exitOnCtrlC: true,
  });

  if (!debug) {
    process.stdout.write('\x1B[2J\x1B[H');
  }

  function cleanup() {
    instance.unmount();
    if (!debug) {
      process.stdout.write('\x1B[2J\x1B[H');
    }
  }

  await instance.waitUntilExit();

  return { cleanup };
}
