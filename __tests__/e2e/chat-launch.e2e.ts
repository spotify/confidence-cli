import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createSession,
  navigateToOnboarding,
  navigateToPlugins,
  CHAT_PROMPT_FILE,
} from './testing-framework/index.js';

describe('when the user starts chat after onboarding', () => {
  it('includes code changes and report file in the prompt', async () => {
    using session = createSession();

    await navigateToOnboarding(session);
    await session.press('Enter');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    await session.waitForText('Continue work with Claude Code');
    await session.press('Enter');

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);

    const prompt = readFileSync(join(session.cwd, CHAT_PROMPT_FILE), 'utf-8');
    expect(prompt).toContain('I just set up Confidence');
    expect(prompt).toContain('Changes made:');
    expect(prompt).toContain('CONFIDENCE_QUICKSTART.md');
    expect(prompt).toContain('continue working on my Confidence integration');
    expect(prompt).toContain('/setup-warehouse');
    expect(prompt).not.toContain('/migrate-');
  });

  it('includes migration hint when competitors are detected', async () => {
    using session = createSession({ project: 'react-statsig' });

    await navigateToOnboarding(session);
    await session.press('Enter');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    await session.waitForText('Continue work with Claude Code');
    await session.press('Enter');

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);

    const prompt = readFileSync(join(session.cwd, CHAT_PROMPT_FILE), 'utf-8');
    expect(prompt).toContain('/setup-warehouse');
    expect(prompt).toContain('/migrate-');
  });

  it('sends an integration prompt when onboarding was skipped', async () => {
    using session = createSession();

    await navigateToOnboarding(session);
    await session.press('ArrowDown');
    await session.press('Enter');

    await session.waitForText('Continue work with Claude Code');
    await session.press('Enter');

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);

    const prompt = readFileSync(join(session.cwd, CHAT_PROMPT_FILE), 'utf-8');
    expect(prompt).toContain("I'd like to integrate Confidence into this project");
    expect(prompt).not.toContain('Changes made:');
    expect(prompt).not.toContain('CONFIDENCE_QUICKSTART.md');
  });

  it('includes MCP warning when tools were skipped', async () => {
    using session = createSession();

    await navigateToPlugins(session);
    await session.press('Enter');

    // Skip connecting tools
    await session.waitForText('Connect Confidence tools?');
    await session.pressRepeat('ArrowDown', 3);
    await session.press('Enter');
    await session.waitForText('Skipped');

    // SelectGoal
    await session.waitForText('Which features would you like to set up?');
    await session.press('Enter');

    // OnboardProject
    await session.waitForText('Start onboarding?');
    await session.waitForText('Skip for now');
    await session.press('Enter');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    // Chat
    await session.waitForText('Continue work with Claude Code');
    await session.press('Enter');

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);

    const prompt = readFileSync(join(session.cwd, CHAT_PROMPT_FILE), 'utf-8');
    expect(prompt).toContain("don't have Confidence MCP tools connected");
  });
});
