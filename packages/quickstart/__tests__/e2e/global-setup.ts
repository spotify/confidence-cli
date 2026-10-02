import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  startMockServer,
  type MockServer,
  createMockBinDir,
} from '@spotify-confidence/testing/e2e';

let mockServer: MockServer;
let tempBase: string;

export async function setup() {
  mockServer = await startMockServer();

  tempBase = mkdtempSync(join(tmpdir(), 'e2e-setup-'));
  const mockBinDir = createMockBinDir(tempBase);

  Object.assign(process.env, mockServer.envVars);
  process.env.E2E_MOCK_BIN_DIR = mockBinDir;
  process.env.E2E_CLI_PATH = resolve(import.meta.dirname, '../../dist/bin/cli.js');
}

export async function teardown() {
  mockServer[Symbol.dispose]();
  rmSync(tempBase, { recursive: true, force: true });
}
