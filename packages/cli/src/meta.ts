import { createRequire } from 'node:module';

export const APP_NAME = 'confidence';

declare const __CLI_VERSION__: string;

function resolveVersion(): string {
  if (typeof __CLI_VERSION__ !== 'undefined') return __CLI_VERSION__;
  const require = createRequire(import.meta.url);
  return (require('../package.json') as { version: string }).version;
}

export const CLI_VERSION = resolveVersion();
