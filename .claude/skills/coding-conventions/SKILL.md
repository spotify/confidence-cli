---
name: coding-conventions
description: TypeScript style, import ordering, module exports, and linting rules for the Confidence CLI monorepo
version: '0.1'
---

# Coding Conventions

This skill defines the TypeScript style, import ordering, module export patterns, and linting rules that apply across all packages in the monorepo. Follow these in every code change.

## TypeScript Style

### Imports

Sort imports in this order, separated by blank lines:

1. Node built-ins (`node:*`)
2. React
3. External dependencies
4. Cross-package (`@spotify-confidence/*`)
5. Path aliases (`@commands/*`, `@features/*`, `@ui/*`, `@output/*`)
6. Relative imports

### Type Definitions

Use `type` instead of `interface`:

```ts
// Correct
type UserInfo = {
  email: string;
  region: string;
};

// Wrong
interface UserInfo {
  email: string;
  region: string;
}
```

### Function Parameters

Use object params when a function has 4 or more arguments:

```ts
// Correct — 4+ params use an object
function createSession({ ide, region, goals, debug }: CreateSessionOpts) { ... }

// Wrong — too many positional args
function createSession(ide: IdeId, region: string, goals: string[], debug: boolean) { ... }
```

### Switch Exhaustiveness

Use `satisfies never` in switch defaults to catch unhandled cases at compile time:

```ts
switch (action) {
  case 'login':
    return handleLogin();
  case 'logout':
    return handleLogout();
  default:
    return action satisfies never;
}
```

### Latest TypeScript Syntax

Use modern TypeScript features: `satisfies`, `using` for disposables, etc.

## React / Hooks

### Named Functions in `useEffect`

Use named function expressions, not arrow functions:

```ts
// Correct
useEffect(
  function autoAdvance() {
    // ...
  },
  [deps],
);

// Wrong
useEffect(() => {
  // ...
}, [deps]);
```

### Event Listener Cleanup

Use `AbortController` for removing event listeners instead of manual `removeEventListener`:

```ts
useEffect(function listenForResize() {
  const controller = new AbortController();
  window.addEventListener('resize', handleResize, { signal: controller.signal });
  return () => controller.abort();
}, []);
```

### React Hooks Linting

`eslint-plugin-react-hooks` with `recommended-latest` rules, all set to `error`.

## Module Exports

Keep the public API compact. Barrel files (`index.ts`) re-export only the public API. Don't re-export internal helpers or types that aren't part of the module's contract.

### Named Types in Actions

Use named types in `actions.ts` files for union extensions. This allows new action variants to be added without modifying existing switch statements across the codebase.

## Cross-Package Imports

Use the npm package name — never relative paths across package boundaries:

```ts
// Cross-package — use npm name
import { ScreenId, track } from '@spotify-confidence/core';
import type { IdeId } from '@spotify-confidence/shared-kernel';

// Cross-domain within a package — use path alias
import { WelcomeScreen } from '@ui/screens/welcome/index.js';
import { buildPrompt } from '@features/onboarding/index.js';

// Within-domain — use relative
import { store } from '../../store.js';
```

Within `packages/core/src/`, always use relative imports (no path aliases — enables external consumers to follow source imports). Core `__tests__/` may use tsconfig path aliases.

## Initialization Hooks

Slices that compute initial state at mount time use a dedicated `useInitial*` hook. This separates one-time "resolve initial state + sync to store" from ongoing interaction logic.

Each init hook: (1) pure `resolve*` function, (2) `useEffect` to sync store, (3) returns values for the parent hook.

## Dry Run Separation

Hooks supporting dry-run mode keep dry-run logic in a separate function. Never interleave dry-run and real logic with conditionals.

## Linting

Strict linting — all rules are errors. ESLint config from `@spotify-confidence/eslint-config` (base) or `@spotify-confidence/eslint-config/react` (for packages with React).

### No Warning Suppression

Never suppress runtime warnings or linter diagnostics. Fix the root cause.

## Enum Usage

Use `ScreenId` enum values from `@spotify-confidence/core` for screen identification. Never use raw strings.

Use `HAlign` / `VAlign` enums from `styles.ts` instead of raw alignment strings (`'flex-start'`, `'center'`, `'flex-end'`).

## Theme Constants

Import `Colors` and `Icons` from `packages/quickstart/src/ui/styles.ts` for consistent theming. Never use raw color values or emoji directly.
