---
name: architecture
description: Monorepo structure, dependency graph, domain boundaries, and package-level constraints for the Confidence CLI project
version: '0.3'
---

# Architecture Guidelines

This skill defines the structural rules, domain boundaries, and constraints that govern all work on the Confidence CLI. Follow these when adding features, refactoring, or reviewing changes.

## Purpose

The Confidence CLI is a set of tools for setting up and integrating [Confidence](https://confidence.spotify.com/) with users' projects. It works together with a Claude Code Skill backed by Confidence MCP tools ([confidence-ai-plugins](https://github.com/spotify/confidence-ai-plugins)) — the Skill handles product knowledge, the CLI handles user interaction.

## Monorepo Structure

The project is a pnpm monorepo with six packages:

| Package                   | Published | Purpose                                                                                                         |
| ------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| `packages/shared-kernel/` | No        | Cross-domain types and `noop` helper                                                                            |
| `packages/eslint-config/` | No        | Shared ESLint config (base + react presets)                                                                     |
| `packages/core/`          | No        | Shared infrastructure (auth, session, telemetry, exec, system, sdk, utils, frameworks, integrations, providers) |
| `packages/testing/`       | No        | Test infrastructure (auth scaffolds, project scaffolds, env helpers, terminal helpers, MSW)                     |
| `packages/quickstart/`    | Yes       | TUI wizard — `@spotify-confidence/quickstart`                                                                   |
| `packages/cli/`           | Yes       | CLI for managing Confidence — `@spotify-confidence/cli`                                                         |

### Dependency Graph

```
shared-kernel ◄── core ◄── quickstart ◄── cli
     ▲
     └── testing
```

- **shared-kernel** → nothing (leaf)
- **core** → shared-kernel
- **testing** → shared-kernel (devDep on core for tests only)
- **quickstart** → core, shared-kernel (devDep on testing, eslint-config)
- **cli** → quickstart (devDep on core, shared-kernel, testing, eslint-config)

### Cross-Package Imports

Use the npm package name for cross-package imports:

```ts
import { ScreenId, track, authenticate } from '@spotify-confidence/core';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { buildTestJwt } from '@spotify-confidence/testing/auth';
import { createProjectDir } from '@spotify-confidence/testing/scaffold';
```

### Intra-Package Imports

Within `packages/quickstart/`, use path aliases for cross-domain imports:

| Alias         | Target           |
| ------------- | ---------------- |
| `@commands/*` | `src/commands/*` |
| `@features/*` | `src/features/*` |
| `@ui/*`       | `src/ui/*`       |

Within `packages/cli/`, use path aliases for cross-domain imports:

| Alias         | Target           |
| ------------- | ---------------- |
| `@commands/*` | `src/commands/*` |
| `@features/*` | `src/features/*` |
| `@output/*`   | `src/output/*`   |
| `@api/*`      | `src/api/*`      |

Within `packages/core/src/`, use relative imports (no path aliases in source — enables external consumers to follow source imports). Core `__tests__/` can use the tsconfig path aliases (`@auth/*`, `@exec/*`, etc.).

## Domain Separation

### Shared Kernel (`packages/shared-kernel/src/`)

Cross-domain vocabulary types that multiple packages depend on. Contains type definitions and the `noop` helper — no other runtime logic.

- Types here form the ubiquitous language of the project: identifiers and enums that appear in function signatures across package boundaries (e.g. `IdeId`, `AuthState`, `OnboardingGoal`, `PluginInstallationMethod`, `DetectedProvider`).
- If a type is used by three or more packages, it belongs here.
- The shared kernel depends on nothing. Every other package may import from it.
- Adding a new shared type: define in `types.ts`, re-export from `index.ts`.

### Core (`packages/core/src/`)

Shared infrastructure organized into cohesive modules:

- **`auth/`** — OAuth PKCE flow + token persistence
- **`session/`** — `WizardSession`, `ScreenId`, `createSession`, and session-related types
- **`telemetry/`** — Analytics + session tracking
- **`exec/`** — Running external commands (`spawn`, `execFile`, `resolveBin`)
- **`system/`** — Environment, filesystem, system checks
- **`sdk/`** — SDK metadata + options
- **`utils/`** — Generic utilities (`addIf`, `interpolate`)
- **`constants.ts`** — Confidence URLs + env-derived values
- **`frameworks/`** — Framework detection (one subdir per framework)
- **`integrations/`** — IDE integration strategies (one subdir per IDE)
- **`providers/`** — Provider detection for competing platforms

Core depends on `shared-kernel`. It must not import from `quickstart`, `cli`, or `testing`.

### Testing (`packages/testing/src/`)

Test infrastructure with sub-path exports:

- **`auth/`** (`@spotify-confidence/testing/auth`) — JWT builders, token scaffolds
- **`scaffold/`** (`@spotify-confidence/testing/scaffold`) — Temp project directory factory
- **`env/`** (`@spotify-confidence/testing/env`) — Environment overlay, platform detection
- **`terminal/`** (`@spotify-confidence/testing/terminal`) — Key-map, key resolution
- **`msw/`** (`@spotify-confidence/testing/msw`) — MSW server setup + handlers

Testing depends on `shared-kernel`. The main barrel (`@spotify-confidence/testing`) re-exports everything including MSW. Use specific sub-paths in e2e tests to avoid MSW's `localStorage` side effect.

### Quickstart (`packages/quickstart/`)

The TUI wizard, organized into:

#### Commands (`src/commands/`)

CLI command definitions using yargs. Each command is a self-contained module exporting a `Command` object.

- Commands orchestrate — they call into `src/ui/` but never contain UI rendering or framework detection logic themselves.

#### Features (`src/features/`)

Vertical feature slices that compose logic from multiple domains. Each feature gets its own subdirectory.

- Currently: `onboarding/` — prompt builder for the project onboarding flow.
- Features may import from `@spotify-confidence/core` and `@spotify-confidence/shared-kernel`.
- Features must not import from `src/ui/` or `src/commands/`.

#### UI (`src/ui/`)

Terminal user interface built with Ink and React:

- **`screens/`** — Every screen is organized as a **slice**: a subdirectory containing the screen component, a barrel `index.ts`, and collocated `log-messages.ts`, `telemetry-events.ts`, and `actions.ts`. Slices with side-effect hooks contain their hooks. Slices needing initial state at mount time use a `useInitial*` hook. Slices with sub-components place them in a collocated `components/` subdirectory.
- **`components/`** — Reusable building blocks (`TextBlock`, `Divider`, `ScreenContainer`, `KeyboardHintsBar`, etc.). Barrel-exported.
- **`styles.ts`** — Theme constants: `Colors`, `Icons`, `HAlign`, `VAlign`.
- **`hooks/`** — Shared hooks used across screens. Screen-specific hooks live in their slice.
- **`lib/`** — Shared utilities and types used across the TUI.
- **`store.ts`** — Reactive state via nanostores.
- **`router.ts`** — State-machine navigation via `WizardRouter`.
- **`screen-transitions.ts`** — Transition map defining valid navigation edges.
- **`screen-registry.tsx`** — Maps `ScreenId` → React component.

### CLI (`packages/cli/`)

The `confidence` CLI, organized into:

#### Entry Point (`bin/cli.ts`)

Uses yargs to define the CLI with global options (`--json`, `--output`, `--project`, `--environment`, `--profile`, `--dry-run`, `--debug`) and commands.

#### Commands (`src/commands/`)

Each command exports an object with `command`, `describe`, `builder` (optional), and `handler` properties. Commands with subcommands (e.g. `config`, `flags`, `events`, `recordings`) use nested yargs builders.

- **`login`** / **`logout`** / **`whoami`** — Auth commands delegating to `@spotify-confidence/core`
- **`config`** — Persistent configuration management (set/get/list/reset)
- **`flags`** / **`events`** / **`recordings`** — Feature-specific setup commands delegating to quickstart
- **`quickstart`** — Launches the interactive TUI wizard

#### Features (`src/features/`)

- **`config/`** — Re-exports config operations from core
- **`quickstart/`** — Launches the quickstart TUI with feature pre-selection

#### Output (`src/output/`)

Structured output formatting with automatic format detection:

- **`detect.ts`** — `resolveFormat()`: `--json` flag → JSON; `--output` flag → specified; TTY → table; pipe → JSON
- **`json.ts`** — `formatJson()`: wraps data in `{ data, meta? }` envelope
- **`table.ts`** — `formatTable()`: dynamically-sized column layout

## Hard Constraints

### No product knowledge in the TUI

The TUI is a generic wizard shell. It must not contain Confidence-specific domain logic. All product knowledge belongs in the Claude Code Skill and is delivered via MCP tools.

### Dependency direction

```
cli commands          → features, output, quickstart, core, shared-kernel
cli features          → quickstart, core, shared-kernel
quickstart commands   → ui, features, core, shared-kernel
quickstart features   → core, shared-kernel
quickstart ui         → features, core, shared-kernel
core                  → shared-kernel
shared-kernel         → nothing
```

No circular dependencies. No upward imports.

Within the quickstart UI layer:

```
screen slices → hooks/, lib/, components/
components/   → lib/, hooks/
hooks/        → lib/
lib/          → nothing in ui/
```

### Screen identification

Always use `ScreenId` enum values from `@spotify-confidence/core`. Never use raw strings.

### State mutations

All session state changes go through `WizardStore` setters. Never mutate the session object directly.

### UI component sourcing

Use `@inkjs/ui` components over standalone `ink-*` packages.
