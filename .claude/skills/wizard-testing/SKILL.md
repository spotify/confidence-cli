---
name: testing
description: Testing guidelines and conventions for the Confidence Wizard CLI project
version: '0.1'
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
  - Use `renderScreen()` for tests that check a single screen's content and interactions.
  - Use `renderApp()` for tests that verify navigation — it renders the full app so screen transitions are visible in the output.
- For store/state: assert on the public API and its effects, not on internal atom values.
- For CLI commands: test the command's output and side effects, not how it assembles arguments internally.

## Mocking

### API Calls — Use MSW

For mocking HTTP/API calls, use [MSW (Mock Service Worker)](https://mswjs.io/). MSW intercepts requests at the network level, keeping the code under test unaware it's being mocked — which means the test exercises the real fetch/request logic.

Do **not** mock `fetch` or HTTP clients directly with `vi.fn()` or `vi.mock()`.

### General Mocking Rules

- Only mock what crosses a **non-emulatable** system boundary — operations that can't be redirected to a temp directory or intercepted by MSW.
- Prefer temp directories over mocking filesystem reads. Use `createProjectDir()` to set up real files; the function under test reads them naturally. Only mock filesystem access when it reads from fixed system paths (e.g., `homedir()`, `tmpdir()`) that can't be overridden via the project dir.
- Prefer MSW over `vi.mock` for HTTP calls. MSW intercepts at the network level, keeping the code under test unaware it's being mocked.
- When partial mocking is needed, use `importOriginal` to keep real functions and mock only what's necessary:
  ```ts
  vi.mock('../../../src/lib/plugins.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../src/lib/plugins.js')>();
    return { ...actual, detectInstalledPlugins: vi.fn().mockReturnValue([]) };
  });
  ```
- Never mock the module under test.
- MSW server setup (`listen`, `resetHandlers`, `close`) belongs in `__tests__/msw/setup.ts`, not in individual test files.

## Tooling

| Tool                  | Purpose                              |
| --------------------- | ------------------------------------ |
| `vitest`              | Test runner (globals enabled)        |
| `ink-testing-library` | TUI screen rendering and interaction |
| `msw`                 | Network-level API mocking            |
| `waitFor`             | Poll until an assertion passes       |

## Test File Location

Tests live in `__tests__/` mirroring the `src/` directory structure:

```
__tests__/
  commands/
  ui/
  lib/
  frameworks/
```

Or colocated as `src/**/__tests__/**/*.test.{ts,tsx}`.

## Test Structure

Use the **Arrange-Act-Assert (AAA)** pattern in every test:

- **Arrange** — set up preconditions and inputs.
- **Act** — execute the system under test.
- **Assert** — verify the expected outcome.

Formatting rules:

- If the test body is **3 lines or fewer**, no blank lines or comments are needed.
- If the test body is **longer than 3 lines**, add **empty lines** between the AAA sections.
- If **each section is longer than 3 lines**, also add `// Arrange`, `// Act`, `// Assert` comments above each section.

Name the system under test variable **`sut`** in all tests.

```ts
// Short test — no separators needed:
it('returns default value', () => {
  const sut = createResolver();
  const result = sut.resolve('flag-key');
  expect(result).toBe('default');
});

// Medium test — blank lines between sections:
it('resolves flag with context', () => {
  const context = { user: 'test-user' };
  const sut = createResolver({ defaultValue: 'on' });

  const result = sut.resolve('flag-key', context);

  expect(result).toBe('on');
  expect(sut.lastContext).toEqual(context);
});

// Long test — comments + blank lines:
it('applies targeting rules in priority order', () => {
  // Arrange
  const rules = [
    { segment: 'beta', value: 'variant-a', priority: 2 },
    { segment: 'internal', value: 'variant-b', priority: 1 },
    { segment: 'all', value: 'control', priority: 3 },
  ];
  const context = { user: 'test-user', segments: ['beta', 'internal'] };
  const sut = createResolver({ rules });

  // Act
  const result = sut.resolve('flag-key', context);
  const appliedRule = sut.getAppliedRule();

  // Assert
  expect(result).toBe('variant-b');
  expect(appliedRule).toMatchObject({ segment: 'internal', priority: 1 });
  expect(sut.evaluationCount).toBe(1);
});
```

## Conventions

- Test files use the `.test.ts` or `.test.tsx` extension.
- **`it` / `test` names** describe the **public behavior** from the API consumer's point of view — what the code does, not how it does it. Focus on inputs, outputs, and observable effects.
- **`describe` blocks** state the **prerequisites or context** under which the nested tests run, also from the consumer's perspective when possible (e.g., `"when the flag has no targeting rules"`, `"given an unauthenticated user"`).

```ts
// Good — consumer-facing behavior and prerequisites:
describe('when the flag has targeting rules', () => {
  it('resolves to the highest-priority matching variant', () => { ... });
  it('falls back to the default value when no rule matches', () => { ... });
});

// Bad — implementation details and vague names:
describe('resolve method internals', () => {
  it('calls evaluateRules and filters the array', () => { ... });
  it('works correctly', () => { ... });
});
```

- One assertion concern per test — multiple `expect` calls are fine if they assert the same behavior.
- No snapshot tests unless explicitly requested.
- **Prefer `createProjectDir()` for setting up project context** (framework, dependencies, project structure) in TUI screen tests. Pass dependencies to control framework detection (e.g., `createProjectDir({ react: '^19.0.0' })` for React, `createProjectDir({ express: '^4.0.0' })` for Node.js, `createProjectDir(null)` for an empty project). Only pre-build a `WizardStore` directly when the test needs store state that `createProjectDir` cannot provide (e.g., a framework already set from an earlier screen).
- **Prefer `using` for disposable resources.** When a helper returns an object with `[Symbol.dispose]` (e.g., `createProjectDir()`, `renderScreen()`, `renderApp()`), declare it with `using` inside each test rather than sharing it via `beforeAll`/`afterAll`. This keeps each test self-contained and guarantees cleanup even if the test throws.

```ts
// Good — each test owns its resources:
it('detects project framework', async () => {
  using project = createProjectDir();
  using sut = renderScreen(<WelcomeScreen />, { dir: project.path });
  await waitFor(() => {
    expect(sut.lastFrame()).toContain('React');
  });
});

// Bad — shared mutable state across tests:
let project: ReturnType<typeof createProjectDir>;
beforeAll(() => { project = createProjectDir(); });
afterAll(() => { project[Symbol.dispose](); });
```

- **Use `waitFor` instead of `await delay`** for TUI assertions. `waitFor` polls until the assertion passes (default 5s timeout, 10ms interval), making tests faster and resilient to timing differences. Never use fixed `await delay(N)` waits before assertions — they are slow and flaky under CPU load.
  - Wrap the assertion directly: `await waitFor(() => { expect(sut.lastFrame()).toContain('X'); })`.
  - When interacting with a rendered component, send input then `waitFor` the result:
    ```ts
    sut.stdin.write(ENTER);
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Next Screen');
    });
    ```
  - When a component must render interactive elements (e.g. a Select) before input can be processed, add a `waitFor` before `stdin.write` to confirm the element is present:
    ```ts
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Connect all MCP tools');
    });
    sut.stdin.write(ENTER);
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Connected');
    });
    ```
  - For multi-step flows (e.g. action then auto-advance), chain separate `waitFor` calls — each gets its own timeout window:
    ```ts
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Authenticated');
    });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Connect MCP');
    });
    ```
