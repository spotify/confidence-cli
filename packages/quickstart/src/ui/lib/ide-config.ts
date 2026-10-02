import { getConfigValue, setConfigValue } from '@spotify-confidence/core';
import type { IdeId } from '@spotify-confidence/shared-kernel';

const VALID_IDE_IDS: readonly IdeId[] = ['claude', 'cursor', 'codex'];

export function readSavedIde(): IdeId | null {
  try {
    const saved = getConfigValue('ide');
    if (saved && VALID_IDE_IDS.includes(saved as IdeId)) return saved as IdeId;
  } catch {
    // config read failed — ignore
  }
  return null;
}

export function saveIdeToConfig(ide: IdeId): void {
  try {
    setConfigValue('ide', ide);
  } catch {
    // config write failed — non-critical
  }
}
