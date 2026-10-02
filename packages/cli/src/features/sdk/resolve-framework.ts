import { message } from '@output/print.js';
import { getFrameworks, detectFramework } from '@spotify-confidence/core';
import type { FrameworkConfig, FrameworkId } from '@spotify-confidence/core';

export async function resolveFramework(
  projectDir: string,
  sdkId?: FrameworkId,
): Promise<FrameworkConfig | null> {
  if (sdkId) {
    return getFrameworks().find((fw) => fw.id === sdkId) ?? null;
  }

  const detected = await detectFramework(projectDir);
  if (detected) message(`Detected ${detected.name} project`);
  return detected;
}
