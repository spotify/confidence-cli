---
name: testing-e2e
description: >
  E2E test framework using node-pty, terminal sessions, mock servers,
  and navigation helpers. Framework lives in packages/testing/src/e2e/,
  imported via @spotify-confidence/testing/e2e.
version: '0.2'
---

# E2E Testing

Load the `testing` skill first for general philosophy — this skill adds the e2e-specific framework.

E2E tests spawn the **built CLI binary** in a real pseudo-terminal via `node-pty`, send keystrokes, and assert on terminal output. They exercise real code paths — not dry-run stubs.

```bash
pnpm test:e2e       # Build + run all e2e tests (not included in pnpm test / pnpm qa)
```

## Layout

- **Framework** — `packages/testing/src/e2e/` (session factory, terminal session, mocks, navigation helpers)
- **Tests** — `packages/quickstart/__tests__/e2e/*.e2e.ts`
- **Global setup** — `packages/quickstart/__tests__/e2e/global-setup.ts` (starts mock server + IDE binaries, sets `E2E_CLI_PATH` / `E2E_MOCK_BIN_DIR`)
- **Config** — `packages/quickstart/vitest.config.e2e.ts` (120s timeout, serial, no MSW)

Import everything from one sub-path:

```ts
import {
  createSession,
  navigateToPlugins,
  simulateAuthCallback,
} from '@spotify-confidence/testing/e2e';
```

## Core API

### `createSession(opts?)`

Spawns the CLI in a pty with an isolated temp project dir. Returns a disposable `TerminalSession`. Key options: `project` (`'react'` | `'empty'`), `token` (pre-seed JWT), `config` (pre-seed `config.json` values like `{ ide: 'cursor' }`). See source JSDoc for the full option set.

### `TerminalSession`

| Method                  | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `press(key)`            | Named key (`'Enter'`, `'ArrowDown'`, `'Space'`) or character |
| `pressRepeat(key, n)`   | Press a key `n` times                                        |
| `waitForText(text)`     | Poll until text appears (scoped to since last checkpoint)    |
| `waitForText([a, b])`   | Poll until any string appears; returns the matched one       |
| `waitForPattern(regex)` | Poll until regex matches; returns `RegExpMatchArray`         |
| `checkpoint()`          | Mark position — subsequent waits/snapshots scope after this  |
| `snapshot()`            | VT100-rendered, normalized output since checkpoint           |
| `waitForExit()`         | Wait for exit; returns exit code                             |

### Navigation Helpers

Pre-built functions that advance through wizard screens. Each takes a `TerminalSession`:

- `navigatePastWelcome` → lands at SelectGoal
- `navigatePastGoalSelection` → lands at Authenticate
- `navigatePastAuth` → lands at InstallPlugins
- `navigateToGoalSelection` / `navigateToPlugins` / `navigateToConnectTools` / `navigateToOnboarding` — cumulative shortcuts from start
- `selectIdeAndOnboard(session, downPresses)` — selects nth IDE and runs through to Done

## Writing Rules

- **File naming**: `*.e2e.ts` (not `.test.ts`)
- **Use `createSession()` per test** for full isolation.
- **Use `using`** for automatic cleanup: `using session = createSession()`.
- **Use `checkpoint()`** between screens to scope assertions to the current screen.
- **Assert positively** — prefer `waitForText('expected')` over `not.toContain(...)`.
- **Use navigation helpers** to skip past earlier screens.

## Example

```ts
import { createSession, navigateToPlugins } from '@spotify-confidence/testing/e2e';

describe('plugin installation', () => {
  it('installs plugins for the detected IDE', async () => {
    using session = createSession();

    await navigateToPlugins(session);
    await session.waitForText('Which CLI agent');
    session.checkpoint();
    await session.press('Enter');

    await session.waitForText('Plugin set up successfully');
  });
});
```
