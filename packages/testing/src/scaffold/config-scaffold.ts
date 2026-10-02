import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type ConfigValues = Record<string, string>;

const FILE_CONFIG = { encoding: 'utf-8', mode: 0o600 } as const;

/**
 * Creates an isolated config directory and sets `CONFIDENCE_CONFIG_DIR`
 * to point to it. Optionally seeds `config.json` with initial values.
 * Supports `Symbol.dispose` for automatic cleanup.
 *
 * @example
 * ```ts
 * using config = createConfigDir();
 * using config = createConfigDir({ ide: 'cursor' });
 * ```
 */
export function createConfigDir(initial?: ConfigValues) {
  const dir = mkdtempSync(join(tmpdir(), 'confidence-config-test-'));
  const prev = process.env['CONFIDENCE_CONFIG_DIR'];
  process.env['CONFIDENCE_CONFIG_DIR'] = dir;

  if (initial) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'config.json'), JSON.stringify(initial, null, 2), FILE_CONFIG);
  }

  return {
    path: dir,
    readConfig(): ConfigValues {
      try {
        return JSON.parse(readFileSync(join(dir, 'config.json'), 'utf-8'));
      } catch {
        return {};
      }
    },
    [Symbol.dispose]() {
      if (prev === undefined) delete process.env['CONFIDENCE_CONFIG_DIR'];
      else process.env['CONFIDENCE_CONFIG_DIR'] = prev;
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    },
  };
}
