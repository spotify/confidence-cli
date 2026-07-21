---
name: architecture
description: Architecture guidelines and constraints for the Confidence Wizard CLI project
version: '0.1'
---

# Architecture Guidelines

This skill defines the structural rules, domain boundaries, and constraints that govern all work on the Confidence Wizard CLI. Follow these when adding features, refactoring, or reviewing changes.

## Purpose

The Confidence Wizard is a CLI tool for quickly setting up and integrating [Confidence](https://confidence.spotify.com/) with users' projects. It works together with a Claude Code Skill backed by Confidence MCP tools ([confidence-ai-plugins](https://github.com/spotify/confidence-ai-plugins)) — the Skill handles product knowledge, the CLI handles user interaction.

## Domain Separation

The project is organized into decoupled top-level concerns. Each has its own subdirectory and must not depend on the others' internals.

### 1. Commands (`src/commands/`)

CLI command definitions using yargs. Each command is a self-contained module exporting a `Command` object.

- Currently: `default` (launches TUI) and `help`.
- Commands orchestrate — they call into `src/ui/` or `src/frameworks/` but never contain UI rendering or framework detection logic themselves.
- New commands get their own file, are re-exported from `src/commands/index.ts`.

### 2. Framework Integrations (`src/frameworks/`)

One subdirectory per supported framework (e.g. `react/`, `nextjs/`, `node/`). Each exports a `FrameworkConfig` implementing a shared interface from `src/frameworks/types.ts`.

- Framework configs define: id, name, docs URL, SDK package, and a `detect()` function.
- The registry (`src/frameworks/index.ts`) exposes `getFrameworks()` and `detectFramework()`.
- Adding a new framework means adding a new subdir with an `index.ts` — no changes to other framework dirs.
- Framework modules must not import from `src/ui/` or `src/commands/`.

### 4. Providers (`src/providers/`)

Provider detection and configuration for competing feature flag platforms (e.g. Statsig, Eppo, PostHog, Optimizely). One subdirectory per provider, plus shared types and dependency-reading utilities.

- The registry (`src/providers/index.ts`) exposes `detectProviders()`.
- Each provider exports a `ProviderConfig` implementing the shared interface from `src/providers/types.ts`.
- Adding a new provider means adding a new subdir — no changes to other provider dirs.
- Provider modules must not import from `src/ui/`, `src/commands/`, or `src/integrations/`.

### 5. UI (`src/ui/`)

Terminal user interface built with Ink and React. Organized into:

- **`tui/screens/`** — Every screen is organized as a **slice**: a subdirectory (e.g. `screens/system-check/`, `screens/welcome/`) containing the screen component, a barrel `index.ts`, and collocated `log-messages.ts` and `telemetry-events.ts` files for screen-specific debug log factories and telemetry event factories. Slices with side-effect hooks also contain their hooks (e.g. `useSystemCheck.ts`). Slices that need initial state computed at mount time have a dedicated `useInitial*` hook (e.g. `useInitialAuth.ts`) — see _Initialization hooks_ below. To add a screen: create a subdir in `screens/`, add the component + barrel + `log-messages.ts` + `telemetry-events.ts`, register in `screen-registry.tsx`, add transitions in `screen-transitions.ts`.
- **`tui/components/`** — Reusable building blocks and composites (`TextBlock`, `Divider`, `ScreenContainer`, `KeyboardHintsBar`, `TitleBar`, etc.). Barrel-exported.
- **`tui/styles.ts`** — Theme constants: `Colors`, `Icons`, `HAlign`, `VAlign`. All visual styling imports from here.
- **`tui/hooks/`** — Shared hooks used across screens (`useStore`, `useRouter`, `useLog`, `useTerminalSize`, etc.). Screen-specific hooks live inside their slice, not here.
- **`tui/lib/`** — Shared utilities and types used across the TUI (`status-line.ts`, `wizard-tasks.ts`, `logger.ts`, `layout-budget.ts`, `tips.ts`). Also contains `log-messages.ts` (shared `LogMessage` type and cross-screen helpers like `skipped()`) and `telemetry-events.ts` (shared telemetry factories like `screenEntered()` used by the `useTelemetry` hook). Screen-specific log and telemetry factories live in each screen's slice, not here.
- **`tui/store.ts`** — Reactive state via nanostores. All mutations through explicit setters that call `emitChange()`.
- **`tui/router.ts`** — State-machine navigation via `WizardRouter`. Uses a `TransitionMap` (screen → event → target screen) with a history stack for back navigation. Screens navigate by calling `nav.to(event)` or `nav.back()` through the type-safe `useNavigation` hook.
- **`tui/screen-transitions.ts`** — Transition map defining all valid screen-to-screen navigation edges. Adding a branch (e.g., a warehouse sub-flow) means adding new edges here — no structural changes needed.
- **`tui/screen-registry.tsx`** — Maps `ScreenId` → React component. Single place to wire up new screens.

UI modules must not import from `src/commands/`. They may import from `src/frameworks/` only to read framework metadata for display.

## Hard Constraints

### No product knowledge in the TUI

The TUI is a generic wizard shell. It must not contain Confidence-specific domain logic such as:

- How to create or configure feature flags
- SDK initialization code or snippets
- API interaction with Confidence services
- Migration logic from other platforms

All of this belongs in the Claude Code Skill and is delivered via Confidence MCP tools (`confidence-flags`, `confidence-docs`). The TUI only renders what the Skill provides.

**Why:** The CLI tool and the Skill are separate products with different release cycles. Embedding product knowledge in the TUI creates coupling that makes both harder to evolve. The Skill has access to live documentation and flag state via MCP — the TUI does not.

### Dependency direction

```
commands → ui, frameworks, lib
ui       → lib, providers (and frameworks for display metadata only)
frameworks → lib
providers  → lib
lib        → nothing in src/
```

No circular dependencies. No upward imports. If two domains need to communicate, it flows through `src/lib/` shared types.

Within the UI layer, the same principle applies at a finer grain:

```
screen slices → hooks/, lib/, components/
components/   → lib/, hooks/
hooks/        → lib/
lib/          → nothing in tui/
```

Shared modules (`hooks/`, `lib/`, `components/`) must never import from screen slices. If a type or utility is needed by both a slice and a shared module, it belongs in `tui/lib/` — not re-exported from the slice.

### Screen identification

Always use `ScreenId` enum values from `src/lib/session.ts`. Never use raw strings for screen identification or navigation.

### State mutations

All session state changes go through `WizardStore` setters. Never mutate the session object directly — the reactivity system depends on `emitChange()` being called.

### UI component sourcing

Use `@inkjs/ui` components (`Select`, `TextInput`, `Spinner`, `ConfirmInput`, `MultiSelect`, `Badge`, `StatusMessage`, `ProgressBar`) over standalone `ink-*` packages. The standalone packages are unmaintained and `@inkjs/ui` supersedes them.

### Framework extensibility

Each framework gets its own subdirectory. Framework-specific logic stays inside that subdir. The shared `FrameworkConfig` interface in `types.ts` is the contract — adding a framework must not require changes to existing framework dirs.

## Coding Conventions

### Initialization Hooks

Slices that compute initial state at mount time (e.g. reading persisted tokens, detecting installed plugins, checking the filesystem) use a dedicated `useInitial*` hook collocated in the same slice directory. This separates the one-time "resolve initial state + sync side effects to the store" concern from the ongoing interaction logic in the main hook.

Each init hook follows the same shape:

1. A pure `resolve*` function (defined outside the hook) that computes initial values from `dryRun` and session data — called once via `useState(() => resolve*(...))`.
2. A `useEffect` that syncs any store side effects (e.g. `store.setAuthState`, `store.setInstalledPlugins`) derived from the resolved values.
3. Returns the resolved values for the parent hook to seed its own `useState` calls.

The parent hook consumes it as `const initial = useInitial*()` and initializes its own state: `useState<Phase>(initial.phase)`.

Existing init hooks:

- `useInitialAuth` — resolves persisted credentials, syncs auth state to store
- `useInitialDetection` — resolves installed plugins, syncs to store
- `useInitialOnboarding` — resolves project emptiness / framework, syncs empty-project flag
- `useInitialMcpDetection` — resolves dry-run phase for MCP detection
- `useInitialSystemCheck` — resolves dry-run checks, syncs check results to store

### Dry Run Separation

Hooks that support dry-run mode must keep dry-run logic in a separate function from the real implementation. Never interleave them with conditionals, ternaries, or early returns inside a shared function body.

Pattern — the dispatch function checks `dryRun` and delegates:

```ts
function startAuth(mode: 'signup' | 'login') {
  setPhase('waiting-browser');
  // shared setup...
  if ($session.get().dryRun) return startDryRunAuth();
  startRealAuth(mode);
}

function startDryRunAuth() {
  // simulated behavior only
}

function startRealAuth(mode: 'signup' | 'login') {
  // real implementation only
}
```

When the dispatch function is inside `useCallback`, define the dry-run and real functions as nested function declarations within the callback body:

```ts
const start = useCallback(
  function start(fwName: string | null) {
    // shared setup...
    if (s.dryRun) return startDryRun();
    startReal();

    function startDryRun() {
      /* ... */
    }
    function startReal() {
      /* ... */
    }
  },
  [deps],
);
```

Init hooks (`useInitial*`) handle the dry-run initial state separately via the `resolve*` function — see _Initialization Hooks_. Effects that only need to skip real work in dry-run mode (e.g. `if (session.dryRun) return;` before `runAllChecks()`) are fine as simple guards when the init hook already set up the dry-run state.

### React Hooks Rules

The project uses `eslint-plugin-react-hooks` with the `recommended-latest` rule set (React Compiler rules). All rules are set to `error` — no warnings. Key rules enforced:

- **`rules-of-hooks`** — Hooks must be called at the top level. Functions returned from hooks must not start with `use` (the linter treats them as hooks and flags calls in callbacks as violations).
- **`exhaustive-deps`** — All values referenced inside `useEffect`/`useMemo`/`useCallback` must appear in the dependency array. Wrap unstable functions in `useCallback` when they're needed as effect deps.
- **`set-state-in-effect`** — Never call `setState` synchronously in an effect body. For mount-time initialization, use lazy `useState(() => computeInitial())` and the `useInitial*` hook pattern instead. Async callbacks (`.then()`, event handlers) inside effects are fine.
- **`immutability`** — Never reference a function or variable before its declaration inside a hook body. Either move the declaration above the call site, inline it into the effect, or use `useCallback`.

### Guarding Redundant State Updates

When syncing derived React state to the store (or vice versa), always compare values before calling a store setter. Store setters call `emitChange()`, which can trigger re-renders through subscriptions. Without a guard, setting the same value repeatedly creates render loops — especially when Ink re-mounts components that re-process buffered input.

Pattern:

```ts
useEffect(
  function syncToStore() {
    const current = store.session.someField;
    if (derived.length === current.length && derived.every((v, i) => v === current[i])) return;
    store.setSomeField(derived);
  },
  [derived, store],
);
```

Similarly, `applyStatuses`-style functions that merge new data into existing state should bail out when nothing actually changed:

```ts
function applyStatuses(updated: Record<string, Status>) {
  if (Object.entries(updated).every(([k, v]) => current[k] === v)) return;
  // ...proceed with setState
}
```

### Path Aliases

Use path aliases (`@commands/`, `@frameworks/`, `@integrations/`, `@providers/`, `@ui/`, `@lib/`) for all imports that cross top-level domain boundaries under `src/`. Keep relative imports for references within the same domain.

Aliases are configured in `tsconfig.build.json` (`paths`) and `vitest.config.ts` (`resolve.alias`). When adding a new top-level domain under `src/`, add its alias to both files.

```ts
// Cross-domain — use alias
import { ScreenId } from '@lib/session.js';
import { getIntegration } from '@integrations/index.js';
import { detectFramework } from '@frameworks/index.js';

// Within-domain — use relative
import { store } from '../../store.js';
import { Colors } from '../styles.js';
```

Test files also use aliases for imports from `src/`:

```ts
import { WelcomeScreen } from '@ui/tui/screens/welcome/index.js';
import { ScreenId } from '@lib/session.js';
```

### TypeScript Style

- Sort imports by groups: system (e.g., node:*), react, other external deps, aliases (`@lib/`, `@integrations/`, etc.), neighboring modules.
- Use `type` instead of `interface` for all type definitions.
- Use latest TypeScript syntax: `satisfies`, `using`, etc.
- When a function has more than 3 parameters, group them into a single object parameter instead of listing them as positional arguments.
- In `useEffect`, use named functions instead of anonymous lambdas for the effect callback.
- Prefer `AbortController` for removing event listeners instead of manually calling `removeEventListener`. Pass `{ signal: controller.signal }` to `addEventListener` and call `controller.abort()` in cleanup. This avoids needing to keep a reference to the exact same handler function and scales cleanly when multiple listeners share a lifetime.
- Prefer "UI as a function of state" — derive values from state and props in the render body rather than stashing them in refs. Resort to `useRef` only when there is no pure-function alternative (e.g. holding a DOM node, a timer ID, or an instance that must survive re-renders without triggering one).
- In `switch` statements, the `default` case must use an exhaustive check via `satisfies never` to catch unhandled variants at compile time:
  ```ts
  default: {
    const _exhaustive: never = value satisfies never;
    throw new Error(`Unhandled: ${_exhaustive}`);
  }
  ```

### Module Exports

- Keep the public API surface of each module compact. Only export what is intended to be consumed by other modules.
- Functions, types, and constants that are internal to a module must not be exported — leave them unexported so the boundary is clear.
- Barrel files (`index.ts`) re-export only the public API; they are not a place to dump everything the module contains.

### Linting

- Strict linting — all rules are errors, never warnings.
- Fix lint errors immediately, do not suppress or downgrade them.
- ESLint config includes `eslint-plugin-react-hooks` (`recommended-latest` flat config) with all warning-level rules upgraded to errors. See _React Hooks Rules_ above for the key rules.

### No Warning Suppression

Never suppress, silence, or filter runtime warnings (e.g. `--no-warnings`, `--disable-warning`, `NODE_NO_WARNINGS`) or compiler/linter diagnostics without explicit consent from the developers. Warnings exist to surface real issues — fix the root cause instead of hiding the symptom.

## Adding New Concerns

When the project grows, new top-level concerns (e.g. `src/agent/` for agent harness logic, `src/detection/` for project analysis) follow the same pattern:

- Own subdirectory under `src/`
- Shared types in `src/lib/` or own `types.ts`
- Exported through a barrel `index.ts`
- No circular dependencies with existing domains
- Documented in this skill and CLAUDE.md

## Confidence MCP Tools

The wizard works alongside two Confidence MCP servers from [confidence-ai-plugins](https://github.com/spotify/confidence-ai-plugins):

- **`confidence-flags`** — Feature flag management: create, list, resolve, target, archive flags; manage clients, metrics, context schema, and warehouses.
- **`confidence-docs`** — Documentation access: search docs, get SDK integration guides, code snippets, and deployment guides.

These are accessed via the Claude Code Skill, never directly from the TUI or CLI code.
