---
name: testing
description: >
  Load before writing, modifying, or adding any test file (unit,
  integration, or e2e). Covers testing philosophy, conventions, test
  infrastructure (packages/testing/), test framework structure
  (packages/quickstart/__tests__/e2e/testing-framework/,
  packages/quickstart/__tests__/ui/testing-framework/),
  and the named-key press() API for e2e tests.
version: '0.3'
---

# Testing Guidelines

This skill defines the testing philosophy, conventions, and tooling for the Confidence Wizard CLI.

## Philosophy

Test **observable behavior**, never implementation details.

Observable behavior is what a user or caller can see: rendered output, return values, emitted events, side effects on external systems. Implementation details are how the code achieves that: internal state shape, private method calls, execution order of internal steps.

**When unsure whether something is observable behavior — ask before writing the test.**

### Test Like a Real User

Write tests that exercise the code the same way a real user would interact with it:

- For TUI screens: assert on rendered terminal output (`lastFrame()`), never on store internals like `store.currentScreen` or `store.session.*`.
  - Prefer `renderApp()` — it renders the full app with framework detection and screen transitions, relying on the project dir (via `createProjectDir()`) for context rather than manually injecting store props.
  - Use `renderScreen()` when `renderApp()` is not feasible — e.g., a screen depends on state that is normally set by a prior screen in the flow. `renderScreen()` accepts a `framework` option and other store props that `renderApp()` does not.
- For store/state: assert on the public API and its effects, not on internal atom values.
- For CLI commands: test the command's output and side effects, not how it assembles arguments internally.

## Mocking

### API Calls — Use MSW

For mocking HTTP/API calls, use [MSW (Mock Service Worker)](https://mswjs.io/). MSW intercepts requests at the network level, keeping the code under test unaware it's being mocked — which means the test exercises the real fetch/request logic.

Do **not** mock `fetch` or HTTP clients directly with `vi.fn()` or `vi.mock()`.

### General Mocking Rules

- Only mock what crosses a **non-emulatable** system boundary.
- Prefer temp directories over mocking filesystem reads. Use `createProjectDir()` to set up real files.
- Prefer MSW over `vi.mock` for HTTP calls.
- When partial mocking is needed, use `importOriginal` to keep real functions and mock only what's necessary:
  ```ts
  vi.mock('@spotify-confidence/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
    return { ...actual, detectInstalledPlugins: vi.fn().mockReturnValue([]) };
  });
  ```
- Never mock the module under test.
- MSW server setup (`listen`, `resetHandlers`, `close`) belongs in `packages/testing/src/msw/setup.ts`, not in individual test files.

## Tooling

| Tool                  | Purpose                              |
| --------------------- | ------------------------------------ |
| `vitest`              | Test runner (globals enabled)        |
| `ink-testing-library` | TUI screen rendering and interaction |
| `msw`                 | Network-level API mocking            |
| `waitFor`             | Poll until an assertion passes       |
| `node-pty`            | E2E tests — spawns CLI in a real pty |

## Test File Location

Tests mirror the source structure within each package:

```
packages/core/__tests__/
  auth/                             # Auth module tests
  exec/                             # Exec module tests
  telemetry/                        # Telemetry module tests
  integrations/                     # Integration tests
  providers/                        # Provider tests

packages/quickstart/__tests__/
  commands/                         # CLI command tests
  features/                         # Feature tests
  ui/                               # Integration tests (ink-testing-library)
    testing-framework/
      ink/                          # Ink rendering (renderScreen, renderApp, act)
      mocks/                        # Mock child process
      async.ts                      # delay, waitFor
    screens/                        # Screen test files
  e2e/                              # End-to-end tests (node-pty)
    testing-framework/
      terminal/                     # PTY infrastructure (TerminalSession, screen buffer)
      mocks/                        # Mock HTTP server + mock IDE binaries
      navigation.ts                 # Screen navigation shortcuts
      session-factory.ts            # createSession() factory
      utils.ts                      # simulateAuthCallback, readInvocation
    *.e2e.ts                        # E2E test files

packages/testing/src/               # Shared test infrastructure
  auth/                             # JWT builders, token scaffolds
  scaffold/                         # Project directory factory
  env/                              # Environment overlay, platform detection
  terminal/                         # Key-map, key resolution
  msw/                              # MSW server + handlers
```

### Test infrastructure imports

Import from specific sub-paths to avoid pulling in unrelated modules:

```ts
import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { createProjectDir } from '@spotify-confidence/testing/scaffold';
import { isWindows } from '@spotify-confidence/testing/env';
import { resolveKey } from '@spotify-confidence/testing/terminal';
import { server } from '@spotify-confidence/testing'; // MSW server (main barrel)
```

## E2E Tests

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

### Testing Framework (`packages/quickstart/__tests__/e2e/testing-framework/`)

- **`createSession(opts?)`** (`session-factory.ts`) — spawns the CLI in a pty with an isolated temp project dir. Pass `{ project: 'empty' }` for an empty project (no `package.json`). Returns a `TerminalSession` with `[Symbol.dispose]`.
- **`TerminalSession`** (`terminal/session.ts`) — wraps node-pty. Key methods: `press(key)` (named keys like `'Enter'`, `'ArrowDown'`), `pressRepeat(key, count)`, `waitForText(text)`, `waitForPattern(regex)`, `waitForExit()`, `checkpoint()`, `snapshot()`, `screen` (full ANSI-stripped output).
- **`simulateAuthCallback()`** (`utils.ts`) — hits the CLI's local OAuth callback server to simulate browser auth.
- **`navigateToPlugins/ConnectTools/Onboarding(session)`** (`navigation.ts`) — navigation shortcuts that advance through earlier screens.
- **Mock HTTP server** (`mocks/server.ts`) — started in global setup, mimics all Confidence APIs. The CLI's API URLs are configurable via env vars, which the global setup points at the local server.
- **Mock IDE binaries** (`mocks/binaries/`) — `claude`, `cursor`, `codex` mock scripts placed on PATH.
- **Shared test scaffolds** — imported from `@spotify-confidence/testing/auth`, `@spotify-confidence/testing/scaffold`, `@spotify-confidence/testing/terminal`, etc.

### Writing E2E Tests

- **File naming**: `*.e2e.ts` (not `.test.ts`)
- **One concern per file**: group related scenarios.
- **Use `createSession()` per test** — each call creates a fresh project dir for full isolation.
- **Use `using`** for automatic cleanup: `using session = createSession()`.
- **Use named keys** with `session.press('Enter')`, `session.press('ArrowDown')`.
- **Assert positively** — prefer `waitForText('expected')` over `not.toContain('unexpected')`.
- **Use `checkpoint()`** between screens to scope `waitForText` and `snapshot()` to the current screen.
- **Use navigation helpers** to skip past earlier screens.

## Test Structure

Use the **Arrange-Act-Assert (AAA)** pattern in every test. Name the system under test variable **`sut`**.

- If the test body is **3 lines or fewer**, no blank lines or comments are needed.
- If **longer than 3 lines**, add empty lines between AAA sections.
- If **each section is longer than 3 lines**, also add `// Arrange`, `// Act`, `// Assert` comments.

## Conventions

- Test files use `.test.ts` or `.test.tsx` extension.
- **`it`/`test` names** describe public behavior from the consumer's point of view.
- **`describe` blocks** state prerequisites or context.
- One assertion concern per test — multiple `expect` calls are fine if they assert the same behavior.
- No snapshot tests unless explicitly requested.
- **Prefer `createProjectDir()`** for setting up project context in TUI screen tests. Import from `@spotify-confidence/testing/scaffold`.
- **Prefer `using`** for disposable resources.
- **Use `waitFor` instead of `await delay`** for TUI assertions.
