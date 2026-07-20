import type { FrameworkConfig } from './types.js';
import { reactFramework } from './react/index.js';
import { nextjsFramework } from './nextjs/index.js';
import { nodeFramework } from './node/index.js';
import { swiftFramework } from './swift/index.js';
import { kotlinFramework } from './kotlin/index.js';
import { javaFramework } from './java/index.js';
import { goFramework } from './go/index.js';
import { pythonFramework } from './python/index.js';

export type { FrameworkConfig } from './types.js';

const FRAMEWORKS: FrameworkConfig[] = [
  nextjsFramework,
  reactFramework,
  swiftFramework,
  kotlinFramework,
  javaFramework,
  goFramework,
  pythonFramework,
  nodeFramework,
];

export function getFrameworks(): FrameworkConfig[] {
  return FRAMEWORKS;
}

export async function detectFramework(dir: string): Promise<FrameworkConfig | null> {
  for (const fw of FRAMEWORKS) {
    if (await fw.detect(dir)) return fw;
  }
  return null;
}
