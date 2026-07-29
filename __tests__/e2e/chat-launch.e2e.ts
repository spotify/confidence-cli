import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createSession,
  navigateToOnboarding,
  navigateToPlugins,
  ENTER,
  ARROW_DOWN,
  CHAT_PROMPT_FILE,
} from './helpers/index.js';

describe('when the user starts chat after onboarding', () => {
  it('includes code changes and report file in the prompt', async () => {
    using session = createSession();

    await navigateToOnboarding(session);
    await session.sendKey(ENTER);
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    await session.waitForText('Continue work with Claude Code');
    await session.sendKey(ENTER);

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);

    const prompt = readFileSync(join(session.cwd, CHAT_PROMPT_FILE), 'utf-8');
    expect(prompt).toContain('I just set up Confidence');
    expect(prompt).toContain('Changes made:');
    expect(prompt).toContain('CONFIDENCE_QUICKSTART.md');
    expect(prompt).toContain('continue working on my Confidence integration');
  });

  it('sends an integration prompt when onboarding was skipped', async () => {
    using session = createSession();

    await navigateToOnboarding(session);
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ENTER);

    await session.waitForText('Continue work with Claude Code');
    await session.sendKey(ENTER);

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
    await session.sendKey(ENTER);

    // Skip connecting tools
    await session.waitForText('Connect Confidence tools?');
    await session.sendKeyRepeat(ARROW_DOWN, 3);
    await session.sendKey(ENTER);
    await session.waitForText('Skipped');

    // Onboard — wait for options to render before pressing Enter
    await session.waitForText('Start onboarding?');
    await session.waitForText('Skip for now');
    await session.sendKey(ENTER);
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    // Chat
    await session.waitForText('Continue work with Claude Code');
    await session.sendKey(ENTER);

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);

    const prompt = readFileSync(join(session.cwd, CHAT_PROMPT_FILE), 'utf-8');
    expect(prompt).toContain("don't have Confidence MCP tools connected");
  });
});
