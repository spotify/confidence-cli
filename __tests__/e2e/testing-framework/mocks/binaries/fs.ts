import { writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { isWindows } from '../../../../shared/platform.js';

export const writeMockBinary = isWindows ? writeWindowsBinary : writeUnixBinary;

function writeUnixBinary(dir: string, name: string, script: string): void {
  const filePath = join(dir, name);
  writeFileSync(filePath, script, 'utf-8');
  chmodSync(filePath, 0o755);
}

function writeWindowsBinary(dir: string, name: string, script: string): void {
  const jsPath = join(dir, `${name}.js`);
  writeFileSync(jsPath, script.replace(/^#!.*\n/, ''), 'utf-8');
  // `.cmd` is for cmd.exe; CreateProcess cannot run it. The CLI resolves
  // `{name}.js` on PATH and runs it with Node instead (`resolveBin`).
  writeFileSync(join(dir, `${name}.cmd`), `@node "%~dp0${name}.js" %*\r\n`, 'utf-8');
}

export const writeMockOpenStub = isWindows
  ? (dir: string) => writeFileSync(join(dir, 'open.cmd'), '@exit /b 0\r\n', 'utf-8')
  : (dir: string) => writeUnixBinary(dir, 'open', '#!/bin/sh\nexit 0\n');
