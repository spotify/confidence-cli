import {
  createSession,
  navigateToPlugins,
  selectIdeAndOnboard,
  readInvocation,
} from './helpers/index.js';

const IDE_CASES = [
  {
    name: 'Claude Code',
    downPresses: 0,
    command: 'claude',
    expectedArgs: ['--print', '--output-format', 'stream-json', '--verbose'],
    expectedPromptSnippets: [
      'Confidence SDK',
      '.claude/skills/analyze-project/SKILL.md',
      'existing codebase',
      'mcp__confidence-flags__',
    ],
  },
  {
    name: 'Cursor',
    downPresses: 1,
    command: 'cursor',
    expectedArgs: ['--print', '--output-format', 'stream-json', '--approve-mcps', '--auto-review'],
    expectedPromptSnippets: [
      'Confidence SDK',
      '.cursor/skills/analyze-project/SKILL.md',
      'existing codebase',
      'mcp__confidence-flags__',
    ],
    firstArg: 'agent',
  },
  {
    name: 'Codex',
    downPresses: 2,
    command: 'codex',
    expectedArgs: ['exec', '--json', '--sandbox', 'workspace-write', '-'],
    expectedPromptSnippets: [
      'Confidence SDK',
      '.agents/skills/analyze-project/SKILL.md',
      'existing codebase',
      'confidence-flags:',
    ],
  },
] as const;

describe.each(IDE_CASES)('$name onboarding invocation', (ide) => {
  it(`spawns ${ide.command} with the correct args and onboarding prompt`, async () => {
    using session = createSession();

    await navigateToPlugins(session);
    await selectIdeAndOnboard(session, ide.downPresses);

    const invocation = readInvocation(session.cwd);

    expect(invocation.command).toBe(ide.command);
    for (const arg of ide.expectedArgs) {
      expect(invocation.args).toContain(arg);
    }
    if ('firstArg' in ide) {
      expect(invocation.args[0]).toBe(ide.firstArg);
    }
    for (const snippet of ide.expectedPromptSnippets) {
      expect(invocation.prompt).toContain(snippet);
    }
    expect(invocation.prompt).toContain(session.cwd);
  });
});
