---
name: testing
description: >
  Testing philosophy, conventions, mocking rules, and UI test
  framework for unit and integration tests across all packages.
version: '0.4'
---

# Testing Guidelines

This skill defines the testing philosophy, conventions, and tooling for the Confidence CLI monorepo. For e2e tests specifically, load the `testing-e2e` skill.

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

packages/cli/__tests__/
  commands/                         # CLI command tests
  features/                         # Feature tests

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

## UI Testing Framework (`packages/quickstart/__tests__/ui/testing-framework/`)

- **`ink/`** — `renderScreen()`, `renderApp()`, `act()` — wrappers around ink-testing-library
- **`mocks/`** — Mock child process for testing spawn-based features
- **`async.ts`** — `delay()`, `waitFor()` — async assertion helpers

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
