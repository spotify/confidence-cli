import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMockServer, type MockServer } from './helpers/mock-server.js';
import { createMockBinDir } from './helpers/mock-binaries.js';

let mockServer: MockServer;
let tempBase: string;

export async function setup() {
  mockServer = await startMockServer();

  tempBase = mkdtempSync(join(tmpdir(), 'e2e-setup-'));
  const mockBinDir = createMockBinDir(tempBase);

  Object.assign(process.env, mockServer.envVars);
  process.env.E2E_MOCK_BIN_DIR = mockBinDir;
}

export async function teardown() {
  mockServer[Symbol.dispose]();
  rmSync(tempBase, { recursive: true, force: true });
}
