import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')) as {
  name: string;
  version: string;
};

export const APP_NAME = pkg.name;
export const APP_VERSION = pkg.version;
