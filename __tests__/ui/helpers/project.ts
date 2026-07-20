import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export function createProjectDir(deps: Record<string, string> | null = { react: '^19.0.0' }) {
  const dir = mkdtempSync(join(tmpdir(), 'wizard-test-'));

  if (deps) {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: deps }));
  }

  return {
    path: dir,
    [Symbol.dispose]() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
