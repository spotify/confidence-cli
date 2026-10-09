import {
  skillInvocation,
  referenceInstruction,
  followInstruction,
} from '@features/onboarding/tool-vars.js';
import type { IdeId } from '@spotify-confidence/shared-kernel';

describe('skillInvocation', () => {
  it.each<{ ide: IdeId; expected: string }>([
    { ide: 'claude', expected: '/confidence:analyze-project' },
    { ide: 'codex', expected: '$analyze-project' },
    { ide: 'cursor', expected: '/analyze-project' },
  ])('returns $expected for $ide', ({ ide, expected }) => {
    const sut = skillInvocation('analyze-project', ide);
    expect(sut).toBe(expected);
  });
});

describe('referenceInstruction', () => {
  it('produces a read instruction with methodology reference', () => {
    const sut = referenceInstruction('analyze-project');
    expect(sut).toContain('analyze-project/SKILL.md');
    expect(sut).toContain('.config/confidence/skills/');
    expect(sut).toMatch(/^Read `/);
    expect(sut).toContain('as a **methodology reference**');
  });
});

describe('followInstruction', () => {
  it('produces a read instruction that tells the agent to follow the skill', () => {
    const sut = followInstruction('migrate-statsig');
    expect(sut).toContain('migrate-statsig/SKILL.md');
    expect(sut).toContain('.config/confidence/skills/');
    expect(sut).toMatch(/^Read `/);
    expect(sut).toContain('follow the skill instructions');
    expect(sut).not.toContain('methodology reference');
  });
});
