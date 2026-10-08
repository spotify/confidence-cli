import { join } from 'node:path';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { PLUGIN_NAME } from '../../constants.js';
import { getSkillsDir } from './local.js';

const SKILL_INVOCATIONS: Record<IdeId, (skill: string) => string> = {
  claude: (skill) => `/${PLUGIN_NAME}:${skill}`,
  codex: (skill) => `$${skill}`,
  cursor: (skill) => `/${skill}`,
};

export function skillInvocation(skillName: string, ide: IdeId): string {
  return SKILL_INVOCATIONS[ide](skillName);
}

export function skillPath(skillName: string): string {
  return join(getSkillsDir(), skillName, 'SKILL.md');
}

export function referenceInstruction(skillName: string): string {
  return `Read \`${skillPath(skillName)}\` as a **methodology reference**`;
}

export function followInstruction(skillName: string): string {
  return `Read \`${skillPath(skillName)}\` and follow the skill instructions`;
}
