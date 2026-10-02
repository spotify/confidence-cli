---
name: testing
description: >
  Testing philosophy, conventions, mocking rules, and UI test
  framework for unit and integration tests across all packages.
version: '0.5'
---

# Testing Guidelines

Testing philosophy, conventions, and tooling for the monorepo. For e2e tests, also load the `testing-e2e` skill.

## Philosophy

Test **observable behavior**, never implementation details.

- For TUI screens: assert on rendered terminal output (`lastFrame()`), never on store internals.
  - Prefer `renderApp()` — renders the full app relying on `createProjectDir()` for context.
  - Use `renderScreen()` when a screen depends on state normally set by a prior screen.
- For store/state: assert on the public API and its effects, not internal atom values.
- For CLI commands: test output and side effects, not argument assembly.

**When unsure whether something is observable behavior — ask before writing the test.**

## Mocking

- **MSW for HTTP** — intercepts at the network level. Never mock `fetch` with `vi.fn()` or `vi.mock()`.
- **Only mock non-emulatable boundaries** — prefer `createProjectDir()` over mocking filesystem.
- **Partial mocking** with `importOriginal`:
  ```ts
  vi.mock('@spotify-confidence/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
    return { ...actual, detectInstalledPlugins: vi.fn().mockReturnValue([]) };
  });
  ```
- Never mock the module under test.
- MSW setup (`listen`, `resetHandlers`, `close`) belongs in `packages/testing/src/msw/setup.ts`.

## Test Infrastructure Imports

Import from specific sub-paths:

```ts
import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { createProjectDir } from '@spotify-confidence/testing/scaffold';
import { isWindows } from '@spotify-confidence/testing/env';
import { server } from '@spotify-confidence/testing';
import { createSession } from '@spotify-confidence/testing/e2e';
```

## UI Testing Framework

`packages/quickstart/__tests__/ui/testing-framework/` provides `renderScreen()`, `renderApp()`, `act()`, `delay()`, `waitFor()`, and mock child process helpers.

## Test Structure

**AAA pattern** in every test. Name the system under test **`sut`**.

- 3 lines or fewer: no blank lines needed.
- Longer: blank lines between AAA sections.
- Each section >3 lines: add `// Arrange`, `// Act`, `// Assert` comments.

## Conventions

- Files: `.test.ts` / `.test.tsx`. Test names describe behavior from the consumer's POV.
- One assertion concern per test (multiple `expect` calls fine if same behavior).
- No snapshot tests unless explicitly requested.
- Prefer `using` for disposable resources.
- Prefer `waitFor` over `await delay` for TUI assertions.
- Prefer `createProjectDir()` for project context in screen tests.
