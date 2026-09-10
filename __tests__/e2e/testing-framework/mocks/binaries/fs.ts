import { writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { IS_WINDOWS } from '../../env.js';

export const writeMockBinary = IS_WINDOWS ? writeWindowsBinary : writeUnixBinary;

function writeUnixBinary(dir: string, name: string, script: string): void {
  const filePath = join(dir, name);
  writeFileSync(filePath, script, 'utf-8');
  chmodSync(filePath, 0o755);
}

function writeWindowsBinary(dir: string, name: string, script: string): void {
  const jsPath = join(dir, `${name}.js`);
  writeFileSync(jsPath, script.replace(/^#!.*\n/, ''), 'utf-8');
  writeFileSync(join(dir, `${name}.cmd`), `@node "%~dp0${name}.js" %*\r\n`, 'utf-8');
}

export const writeMockOpenStub = IS_WINDOWS
  ? (dir: string) => writeFileSync(join(dir, 'open.cmd'), '@exit /b 0\r\n', 'utf-8')
  : (dir: string) => writeUnixBinary(dir, 'open', '#!/bin/sh\nexit 0\n');
