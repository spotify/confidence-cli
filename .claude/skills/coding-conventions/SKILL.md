---
name: coding-conventions
description: TypeScript style, import ordering, module exports, and linting rules for the Confidence CLI monorepo
version: '0.2'
---

# Coding Conventions

TypeScript style and linting rules that apply across all packages.

## TypeScript Style

- **Import order** (blank-line separated): node built-ins → React → external deps → `@spotify-confidence/*` → path aliases → relative
- **`type` over `interface`** for all type definitions
- **Object params** when a function has 4+ arguments
- **`satisfies never`** in switch defaults for exhaustiveness checking
- **Modern syntax**: `satisfies`, `using` for disposables, etc.

## React / Hooks

- **Named functions in `useEffect`**, not arrow functions:
  ```ts
  useEffect(function autoAdvance() { ... }, [deps]);
  ```
- **`AbortController`** for event listener cleanup instead of manual `removeEventListener`
- **`eslint-plugin-react-hooks`** with `recommended-latest`, all set to `error`

## Module Exports

- Barrel files re-export only the public API — no internal helpers.
- Use named types in `actions.ts` for union extensions.

## Quickstart-Specific

- **`useInitial*` hooks** for slices that compute initial state at mount: (1) pure `resolve*` function, (2) `useEffect` to sync store, (3) return values for parent hook.
- **Dry run separation** — keep dry-run logic in a separate function, never interleaved with conditionals.
- **Enums** — `ScreenId` for screens, `HAlign`/`VAlign` for alignment, `Colors`/`Icons` from `styles.ts` for theming. Never raw strings or values.

## Linting

Strict — all rules are errors. Config from `@spotify-confidence/eslint-config` (base) or `/react` (for React packages). Never suppress warnings or diagnostics; fix the root cause.
