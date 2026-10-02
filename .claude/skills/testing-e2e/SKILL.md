---
name: testing-e2e
description: >
  E2E test framework using node-pty, terminal sessions, mock servers,
  and navigation helpers for the quickstart TUI.
version: '0.1'
---

# E2E Testing

This skill covers end-to-end tests that spawn the built CLI binary in a real pseudo-terminal. Load the `testing` skill first for general testing philosophy and conventions — this skill adds the e2e-specific framework.

## Overview

E2E tests spawn the **built CLI binary** (`packages/quickstart/dist/bin/cli.js`) in a real pseudo-terminal via `node-pty`, send keystrokes, and assert on terminal output. They exercise real code paths — not the dry-run stubs.

### Running

```bash
pnpm test:e2e       # Build + run all e2e tests
```

E2E tests are **not** included in `pnpm test` or `pnpm qa`. They run in a separate CI job.

### Config

E2E tests use a dedicated vitest config (`packages/quickstart/vitest.config.e2e.ts`) with:

- 120s test timeout (the full wizard flow takes ~12s)
- Serial execution (`maxWorkers: 1`)
- No MSW setup (HTTP is mocked via a real local server)
- Global setup in `packages/quickstart/__tests__/e2e/global-setup.ts`

## Testing Framework (`packages/quickstart/__tests__/e2e/testing-framework/`)

### Session Factory

- **`createSession(opts?)`** (`session-factory.ts`) — spawns the CLI in a pty with an isolated temp project dir. Pass `{ project: 'empty' }` for an empty project (no `package.json`). Returns a `TerminalSession` with `[Symbol.dispose]`.

### Terminal Session

- **`TerminalSession`** (`terminal/session.ts`) — wraps node-pty. Key methods:
  - `press(key)` — named keys like `'Enter'`, `'ArrowDown'`
  - `pressRepeat(key, count)` — repeat a key press
  - `waitForText(text)` — wait until text appears in output
  - `waitForPattern(regex)` — wait until regex matches output
  - `waitForExit()` — wait for process to terminate
  - `checkpoint()` — mark a screen boundary for scoped assertions
  - `snapshot()` — get current screen content (after last checkpoint)
  - `screen` — full ANSI-stripped output

### Utilities

- **`simulateAuthCallback()`** (`utils.ts`) — hits the CLI's local OAuth callback server to simulate browser auth.
- **`navigateToPlugins/ConnectTools/Onboarding(session)`** (`navigation.ts`) — navigation shortcuts that advance through earlier screens.
- **`readInvocation(session)`** (`utils.ts`) — reads invocation output from the terminal.

### Mock Infrastructure

- **Mock HTTP server** (`mocks/server.ts`) — started in global setup, mimics all Confidence APIs. The CLI's API URLs are configurable via env vars, which the global setup points at the local server.
- **Mock IDE binaries** (`mocks/binaries/`) — `claude`, `cursor`, `codex` mock scripts placed on PATH.
- **Shared test scaffolds** — imported from `@spotify-confidence/testing/auth`, `@spotify-confidence/testing/scaffold`, `@spotify-confidence/testing/terminal`, etc.

## Writing E2E Tests

- **File naming**: `*.e2e.ts` (not `.test.ts`)
- **One concern per file**: group related scenarios.
- **Use `createSession()` per test** — each call creates a fresh project dir for full isolation.
- **Use `using`** for automatic cleanup: `using session = createSession()`.
- **Use named keys** with `session.press('Enter')`, `session.press('ArrowDown')`.
- **Assert positively** — prefer `waitForText('expected')` over `not.toContain('unexpected')`.
- **Use `checkpoint()`** between screens to scope `waitForText` and `snapshot()` to the current screen.
- **Use navigation helpers** to skip past earlier screens.

## Example

```ts
import { createSession } from './testing-framework/session-factory.js';
import { navigateToPlugins } from './testing-framework/navigation.js';

describe('plugin installation', () => {
  it('installs plugins for the detected IDE', async () => {
    using session = createSession();

    await navigateToPlugins(session);
    await session.waitForText('Install plugins');
    session.press('Enter');

    await session.waitForText('Plugins installed');
  });
});
```
