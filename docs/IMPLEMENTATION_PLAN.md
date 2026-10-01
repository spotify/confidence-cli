# Confidence CLI — Implementation Plan

## Overview

Introduce a full-featured CLI (`@spotify-confidence/cli`) alongside the existing quickstart wizard (`@spotify-confidence/quickstart`) in a pnpm monorepo. The CLI provides standalone commands for managing feature flags, experiments, session recordings, and event tracking. It produces structured JSON output, is MCP-first with API fallback, and is designed to be used by both humans and AI agents. The quickstart wizard remains unchanged — same package name, same binary, same behavior.

## Competitive Context

| Competitor             | CLI?        | Pattern         | AI/Agent                | Notes                               |
| ---------------------- | ----------- | --------------- | ----------------------- | ----------------------------------- |
| LaunchDarkly (`ldcli`) | Yes (Go)    | `resource verb` | AGENTS.md, MCP          | Most mature. Guided `setup` + CRUD. |
| PostHog (`posthog`)    | Yes (Rust)  | `resource verb` | Agent-first, MCP skills | Newest. Heavy AI integration.       |
| Statsig (`siggy`)      | Yes (Node)  | `resource verb` | MCP announced           | Solid CRUD.                         |
| Amplitude              | Wizard only | —               | AI-guided onboarding    | No general CLI.                     |
| Eppo                   | None        | —               | —                       | API-only.                           |
| Split.io               | Stale       | —               | —                       | Abandoned experiment.               |

**Our differentiators:**

1. MCP-first architecture — CLI commands delegate to the same MCP tools that AI agents use.
2. Interactive fallback UX — missing args prompt interactively (Vercel-style), not wall-of-errors.
3. Quickstart wizard available — can be combined with CLI via `npx @spotify-confidence/quickstart`.
4. Provider migration built-in — detect and migrate from Statsig/PostHog/Eppo/Optimizely.

## Key Decisions

1. **MCP-first, API-fallback.** Commands delegate to MCP servers (`confidence-flags`, `confidence-docs`) when available. Falls back to direct Confidence REST API when MCP is unavailable (e.g., CI environments without Claude Code).
2. **Monorepo with layered packages.** Phase 0 establishes six packages: `shared-kernel` (cross-domain types), `utils` (generic utilities), `core` (shared infrastructure), `testing` (test scaffolds), `quickstart` (existing wizard), and `eslint-config` (shared lint rules). The CLI package is added later in Phase 1 when CLI development begins. Shared types live in `@spotify-confidence/shared-kernel` (types-only, no runtime logic). Generic utilities (like `noop`, `prompt-utils`) live in `@spotify-confidence/utils`. Domain infrastructure (auth, telemetry, frameworks, integrations, providers) lives in `@spotify-confidence/core`. All three are private workspace packages, not published to npm.
3. **npm only** for distribution (for now). `npx @spotify-confidence/cli` is the install path for the CLI; `npx @spotify-confidence/quickstart` remains the install path for the wizard.
4. **yargs** stays as the CLI framework — already a dependency, sufficient for the command surface.

## Monorepo Package Structure

### What changes

|                       | Before                                               | After                                                                    |
| --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Repo layout           | Single package at root                               | pnpm monorepo with `packages/`                                           |
| Quickstart package    | `@spotify-confidence/quickstart` (root)              | `@spotify-confidence/quickstart` (`packages/quickstart/`)                |
| Quickstart binary     | `confidence-quickstart`                              | `confidence-quickstart` (unchanged)                                      |
| Quickstart UI path    | `src/ui/tui/` (nested)                               | `src/ui/` (flattened)                                                    |
| Shared types          | `src/shared-kernel/` at root                         | `@spotify-confidence/shared-kernel` (`packages/shared-kernel/`, private) |
| Shared utilities      | `src/lib/noop.ts`, `src/lib/prompt-utils.ts` at root | `@spotify-confidence/utils` (`packages/utils/`, private)                 |
| Shared infrastructure | `src/lib/`, `src/frameworks/`, etc. at root          | `@spotify-confidence/core` (`packages/core/`, private)                   |
| Test utilities        | `__tests__/shared/`, `__tests__/msw/` at root        | `@spotify-confidence/testing` (`packages/testing/`, private)             |
| ESLint config         | `eslint.config.js` at root                           | `@spotify-confidence/eslint-config` (`packages/eslint-config/`, private) |
| CLI package           | —                                                    | `@spotify-confidence/cli` (`packages/cli/`, added in Phase 1)            |

### No breaking changes

The quickstart package keeps its name, version line, and binary. Existing users are not affected. The CLI is a brand-new package starting at `v1.0.0`.

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

### release-please config

release-please supports monorepos natively via the manifest releaser. The `node-workspace` plugin handles cross-package version bumps (e.g., if `core` bumps, dependents get updated `package.json` entries).

`release-please-config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "plugins": ["node-workspace"],
  "packages": {
    "packages/quickstart": {},
    "packages/core": {}
  }
}
```

`.release-please-manifest.json`:

```json
{
  "packages/quickstart": "1.6.0",
  "packages/core": "0.0.0"
}
```

Each package gets its own `CHANGELOG.md` in its directory. Versions are tracked independently. `core` is tracked by release-please for changelog/versioning even though it's `private: true` — release-please won't attempt to publish it. `shared-kernel`, `utils`, `eslint-config`, and `testing` are too small to warrant individual changelogs — their changes are captured via the packages that consume them. The CLI package is added to release-please config in Phase 1.

### Package dependency graph

```
@spotify-confidence/shared-kernel (private, types-only leaf)
                  │
       ┌──────────┼──────────────────┐
       ▼          ▼                  ▼
@spotify-confidence/utils    @spotify-confidence/core    @spotify-confidence/quickstart
    (private)                   (private)                    (published)
                  │                  │
                  ▼                  │
       @spotify-confidence/core ◄───┘
                  │
                  ▼
       @spotify-confidence/quickstart

Simplified:
  shared-kernel ◄── utils ◄──┐
       ▲                      ├── core ◄── quickstart
       └──────────────────────┘              │
                                             │ (devDependency)
  testing (private) ◄───────────────────────┘
       ▲
       └── depends on core

  eslint-config (private, standalone tooling — no app deps)
```

When the CLI package is added (Phase 1), it mirrors quickstart's dependency pattern: depends on `core` (runtime) and `testing` (devDependency).

## Architecture

### MCP-First Execution Model

```
User runs: confidence flags list --project my-project

  1. CLI parses args (yargs)
  2. Resolves auth token (persisted or env var)
  3. Attempts MCP call to confidence-flags server
     ├── Success → parse response → format output
     └── Failure (MCP unavailable) → fall back to REST API call
  4. Format output (JSON if --json or piped, table if TTY)
  5. Exit with appropriate code
```

### Directory Structure

```
packages/
├── shared-kernel/                         # Cross-domain types — NOT published to npm
│   ├── package.json                       # { "name": "@spotify-confidence/shared-kernel", "private": true }
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                       # barrel export
│       └── types.ts                       # IdeId, OnboardingGoal, PluginInstallationMethod, ProviderId, DetectedProvider
│
├── utils/                                 # Generic shared utilities — NOT published to npm
│   ├── package.json                       # { "name": "@spotify-confidence/utils", "private": true }
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                       # barrel export
│       ├── noop.ts                        # async noop helper
│       └── prompt-utils.ts               # addIf(), interpolate() — template helpers
│
├── eslint-config/                         # Shared ESLint configuration — NOT published to npm
│   ├── package.json                       # { "name": "@spotify-confidence/eslint-config", "private": true }
│   └── index.js                           # exports tseslint.config(...) with TS + React Hooks + Prettier rules
│
├── core/                                  # Shared infrastructure — NOT published to npm
│   ├── package.json                       # { "name": "@spotify-confidence/core", "private": true, depends on shared-kernel, utils }
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                       # barrel export
│       │
│       ├── auth/                          # OAuth PKCE flow + token persistence (from lib/auth.ts, lib/callback-pages.ts)
│       │   ├── index.ts
│       │   ├── authenticate.ts
│       │   └── callback-pages.ts
│       │
│       ├── telemetry/                     # Analytics + session tracking (from lib/telemetry.ts, lib/session.ts)
│       │   ├── index.ts
│       │   ├── telemetry.ts
│       │   └── session.ts
│       │
│       ├── exec/                          # Running external commands (from lib/exec.ts, lib/resolve-bin.ts)
│       │   ├── index.ts
│       │   ├── exec.ts
│       │   └── resolve-bin.ts
│       │
│       ├── system/                        # Environment + system checks (from lib/env.ts, lib/system-check.ts, lib/fs.ts)
│       │   ├── index.ts
│       │   ├── env.ts
│       │   ├── fs.ts
│       │   └── system-check.ts
│       │
│       ├── sdk/                           # SDK metadata + options (from lib/meta.ts, lib/sdk-options.ts)
│       │   ├── index.ts
│       │   ├── meta.ts
│       │   └── sdk-options.ts
│       │
│       ├── constants.ts                   # Confidence URLs + env-derived values (from lib/constants.ts)
│       │
│       ├── frameworks/                    # Framework detection (extracted from root src/frameworks/)
│       │   ├── index.ts
│       │   ├── types.ts
│       │   ├── react/
│       │   ├── nextjs/
│       │   ├── node/
│       │   ├── go/
│       │   ├── java/
│       │   ├── kotlin/
│       │   ├── python/
│       │   └── swift/
│       │
│       ├── integrations/                  # IDE integrations (extracted from root src/integrations/)
│       │   ├── index.ts
│       │   ├── types.ts
│       │   ├── registry.ts
│       │   ├── constants.ts
│       │   ├── chat.ts
│       │   ├── stream-json.ts
│       │   ├── utils.ts
│       │   ├── version.ts
│       │   ├── claude/
│       │   ├── cursor/
│       │   ├── codex/
│       │   ├── mcp/
│       │   └── skills/
│       │
│       ├── providers/                     # Provider detection (extracted from root src/providers/)
│       │   ├── index.ts
│       │   ├── types.ts
│       │   ├── deps/
│       │   ├── statsig/
│       │   ├── eppo/
│       │   ├── posthog/
│       │   └── optimizely/
│       │
│       └── mcp-client/                    # Programmatic MCP client (added in Phase 2)
│           ├── index.ts                   # MCP HTTP client
│           └── types.ts                   # MCP request/response types
│
├── testing/                               # Shared test infrastructure — NOT published to npm
│   ├── package.json                       # { "name": "@spotify-confidence/testing", "private": true }
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                       # barrel export
│       ├── msw/                           # MSW handlers (extracted from root __tests__/msw/)
│       │   └── handlers.ts
│       └── shared/                        # Shared test scaffolds (extracted from root __tests__/shared/)
│           └── ...
│
├── quickstart/                            # Existing TUI wizard — published as @spotify-confidence/quickstart
│   ├── package.json                       # { "name": "@spotify-confidence/quickstart", depends on core, shared-kernel, utils }
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── tsdown.config.ts
│   ├── vitest.config.ts
│   ├── vitest.config.e2e.ts
│   ├── bin/
│   │   └── cli.ts                         # entry point — launches TUI by default
│   ├── src/
│   │   ├── commands/                      # CLI command definitions (default, help)
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── default.ts
│   │   │   └── help.ts
│   │   │
│   │   ├── features/
│   │   │   └── onboarding/                # Prompt builder for the onboarding flow
│   │   │       ├── build-prompt.ts
│   │   │       ├── sections/
│   │   │       ├── steps/
│   │   │       └── ...
│   │   │
│   │   └── ui/                            # Ink/React TUI (flattened from ui/tui/)
│   │       ├── App.tsx
│   │       ├── start-tui.ts
│   │       ├── screens/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── theme/
│   │       ├── store.ts
│   │       ├── router.ts
│   │       ├── screen-registry.tsx
│   │       ├── screen-transitions.ts
│   │       ├── styles.ts
│   │       └── ...
│   │
│   └── __tests__/                         # Existing tests (moved from root)
│       ├── ui/
│       ├── features/
│       ├── commands/
│       ├── shared/
│       └── e2e/
│
└── cli/                                   # NEW: Full CLI — added in Phase 1, published as @spotify-confidence/cli
    ├── package.json                       # { "name": "@spotify-confidence/cli", depends on core, shared-kernel, utils }
    ├── tsconfig.json
    ├── tsconfig.build.json
    ├── tsdown.config.ts
    ├── vitest.config.ts
    ├── bin/
    │   └── cli.ts                         # entry point — yargs root with subcommands
    ├── src/
    │   ├── commands/                      # Thin yargs command definitions (routing layer)
    │   │   ├── index.ts                   # command registry — exports all commands
    │   │   ├── types.ts                   # Command type
    │   │   ├── login.ts                   # → lib/auth (from core)
    │   │   ├── logout.ts                  # → lib/auth (from core)
    │   │   ├── whoami.ts                  # → lib/auth (from core)
    │   │   ├── config.ts                  # → features/config/
    │   │   ├── flags.ts                   # → features/flags/
    │   │   ├── experiments.ts             # → features/experiments/
    │   │   ├── recordings.ts              # → features/recordings/
    │   │   ├── events.ts                  # → features/events/
    │   │   ├── projects.ts                # → features/projects/
    │   │   ├── environments.ts            # → features/environments/
    │   │   ├── docs.ts                    # → features/docs/
    │   │   ├── sdk.ts                     # → features/sdk/
    │   │   ├── mcp.ts                     # → features/mcp/
    │   │   ├── agents.ts                  # → features/agents/
    │   │   ├── migrate.ts                 # → features/migrate/
    │   │   ├── update.ts                  # self-update
    │   │   └── completion.ts              # shell completions
    │   │
    │   ├── features/                      # Vertical feature slices (business logic)
    │   │   ├── config/                    # Persistent config management
    │   │   │   ├── index.ts
    │   │   │   ├── config.ts              # read/write ~/.config/confidence/config.json
    │   │   │   └── profiles.ts            # multi-profile support
    │   │   │
    │   │   ├── flags/                     # Feature flag operations
    │   │   │   ├── index.ts
    │   │   │   ├── list.ts
    │   │   │   ├── get.ts
    │   │   │   ├── create.ts
    │   │   │   ├── update.ts
    │   │   │   ├── toggle.ts
    │   │   │   ├── resolve.ts
    │   │   │   ├── target.ts
    │   │   │   ├── archive.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── experiments/               # Experiment operations
    │   │   │   ├── index.ts
    │   │   │   ├── list.ts
    │   │   │   ├── get.ts
    │   │   │   ├── create.ts
    │   │   │   ├── results.ts
    │   │   │   ├── launch.ts
    │   │   │   ├── pause.ts
    │   │   │   ├── end.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── recordings/                # Session recording operations
    │   │   │   ├── index.ts
    │   │   │   ├── status.ts
    │   │   │   ├── setup.ts
    │   │   │   ├── list.ts
    │   │   │   ├── get.ts
    │   │   │   ├── config.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── events/                    # Event tracking operations
    │   │   │   ├── index.ts
    │   │   │   ├── list.ts
    │   │   │   ├── get.ts
    │   │   │   ├── track.ts
    │   │   │   ├── create.ts
    │   │   │   ├── validate.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── projects/                  # Project/environment lookups
    │   │   │   ├── index.ts
    │   │   │   ├── list.ts
    │   │   │   └── get.ts
    │   │   │
    │   │   ├── environments/
    │   │   │   ├── index.ts
    │   │   │   ├── list.ts
    │   │   │   └── get.ts
    │   │   │
    │   │   ├── docs/                      # Documentation search
    │   │   │   ├── index.ts
    │   │   │   ├── search.ts
    │   │   │   └── open.ts
    │   │   │
    │   │   ├── sdk/                       # SDK management
    │   │   │   ├── index.ts
    │   │   │   ├── install.ts
    │   │   │   ├── setup.ts
    │   │   │   └── status.ts
    │   │   │
    │   │   ├── mcp/                       # MCP server management (for end users)
    │   │   │   ├── index.ts
    │   │   │   ├── install.ts
    │   │   │   ├── status.ts
    │   │   │   └── uninstall.ts
    │   │   │
    │   │   ├── agents/                    # Agent instruction management
    │   │   │   ├── index.ts
    │   │   │   ├── install.ts
    │   │   │   └── update.ts
    │   │   │
    │   │   └── migrate/                   # Provider migration
    │   │       ├── index.ts
    │   │       ├── detect.ts
    │   │       └── run.ts
    │   │
    │   ├── output/                        # CLI output formatting
    │   │   ├── index.ts                   # output dispatcher
    │   │   ├── json.ts                    # JSON envelope formatter
    │   │   ├── table.ts                   # colored table formatter
    │   │   └── detect.ts                  # TTY/pipe auto-detection
    │   │
    │   └── api/                           # REST API fallback client
    │       ├── client.ts                  # HTTP client with auth
    │       ├── types.ts                   # API response types
    │       └── endpoints.ts               # endpoint definitions
    │
    └── __tests__/
        ├── commands/
        ├── features/
        ├── output/
        └── api/
```

#### Dependency rules

- **`packages/shared-kernel/`** → types-only leaf. No runtime dependencies. Never imports from any other workspace package.
- **`packages/utils/`** → generic utilities. May import from `@spotify-confidence/shared-kernel` if a utility needs a shared type. Never imports from `core`, `quickstart`, `cli`, or `testing`.
- **`packages/eslint-config/`** → standalone tooling package. Exports the shared ESLint configuration. No workspace dependencies.
- **`packages/core/`** → shared infrastructure. Imports from `@spotify-confidence/shared-kernel` and `@spotify-confidence/utils`. Never imports from `quickstart`, `cli`, or `testing`.
- **`packages/testing/`** → shared test infrastructure. May import from `@spotify-confidence/core`. Never imports from `quickstart` or `cli`.
- **`packages/quickstart/`** → imports from `@spotify-confidence/core`, `@spotify-confidence/shared-kernel`, and `@spotify-confidence/utils` (runtime). Uses `@spotify-confidence/testing` and `@spotify-confidence/eslint-config` as devDependencies. No dependency on `cli`.
- **`packages/cli/`** (added in Phase 1) → imports from `@spotify-confidence/core`, `@spotify-confidence/shared-kernel`, and `@spotify-confidence/utils` (runtime). Uses `@spotify-confidence/testing` and `@spotify-confidence/eslint-config` as devDependencies. No dependency on `quickstart`.
- Within `cli`:
  - `commands/` → thin routing only. Each file imports from one `features/<name>/` and from `output/`. No business logic in commands.
  - `features/<name>/` → imports from `output/`, `api/`, and from `@spotify-confidence/core` (including `mcp-client`). Never imports from other feature slices or from `commands/`.
  - `output/` → pure formatters. No feature logic, no I/O.
  - `api/` → REST fallback infrastructure only. Imports from `@spotify-confidence/core` (auth, config). Never imports from `features/`.

#### Path aliases

Each package defines its own tsconfig path aliases scoped to its `src/`.

**`packages/core/`:**

| Alias             | Target               |
| ----------------- | -------------------- |
| `@auth/*`         | `src/auth/*`         |
| `@telemetry/*`    | `src/telemetry/*`    |
| `@exec/*`         | `src/exec/*`         |
| `@system/*`       | `src/system/*`       |
| `@sdk/*`          | `src/sdk/*`          |
| `@frameworks/*`   | `src/frameworks/*`   |
| `@integrations/*` | `src/integrations/*` |
| `@providers/*`    | `src/providers/*`    |
| `@mcp-client/*`   | `src/mcp-client/*`   |

**`packages/quickstart/`:**

| Alias         | Target           |
| ------------- | ---------------- |
| `@commands/*` | `src/commands/*` |
| `@features/*` | `src/features/*` |
| `@ui/*`       | `src/ui/*`       |

Cross-package imports use the npm package name: `import { authenticate } from '@spotify-confidence/core'`, `import type { IdeId } from '@spotify-confidence/shared-kernel'`, `import { noop } from '@spotify-confidence/utils'`.

**`packages/cli/`** (added in Phase 1):

| Alias         | Target           |
| ------------- | ---------------- |
| `@commands/*` | `src/commands/*` |
| `@features/*` | `src/features/*` |
| `@output/*`   | `src/output/*`   |
| `@api/*`      | `src/api/*`      |

### CLI vs IDE Agent: Separation of Concerns

The CLI and IDE agents (Claude Code, Cursor, Codex) are independent consumers of the same Confidence MCP servers. They do not depend on each other.

```
┌─────────────────────┐     ┌──────────────────────┐
│   Confidence CLI    │     │   IDE Agent           │
│  (confidence flags  │     │  (Claude Code /       │
│   list, etc.)       │     │   Cursor / Codex)     │
└────────┬────────────┘     └────────┬─────────────┘
         │ direct HTTP                │ MCP protocol
         │ (mcp-client/)              │ (IDE config)
         ▼                            ▼
┌─────────────────────────────────────────────────┐
│         Confidence MCP Servers (HTTP)            │
│  https://mcp.confidence.dev/mcp/flags            │
│  https://mcp.confidence.dev/mcp/docs             │
└─────────────────────────────────────────────────┘
```

**How each layer uses the IDE choice:**

| Command category                                                   | IDE choice needed? | How it works                                                                                                                                                                                                           |
| ------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource commands (`flags`, `experiments`, `recordings`, `events`) | **No**             | CLI calls MCP servers directly over HTTP with its own auth token. No IDE involved.                                                                                                                                     |
| IDE setup (`mcp install`, `agents install`, `mcp status`)          | **Yes**            | Reads `ide` from config (or prompts if unset). Writes MCP server config to the correct IDE config file (`.claude.json`, `.cursor/mcp.json`, etc.) using `@spotify-confidence/core`'s `integrations/` strategy pattern. |
| Quickstart wizard (`npx @spotify-confidence/quickstart`)           | **Yes**            | Detects or prompts for IDE during the TUI flow. Stores choice in wizard session and configures everything.                                                                                                             |
| AI-assisted commands (`migrate <provider>`)                        | **Optional**       | Can invoke the chosen IDE's agent for AI-powered tasks. Falls back to non-AI workflow if no IDE is configured.                                                                                                         |

**The `ide` config key:**

- Set during `confidence quickstart` (stored in `~/.config/confidence/config.json`)
- Set manually via `confidence config set ide claude|cursor|codex`
- Auto-detected by scanning for installed IDE binaries (same logic as `core`'s `integrations/registry.ts`)
- Only consumed by commands that configure IDE-specific files
- Default: auto-detect; if multiple IDEs found and config is unset, prompt interactively

### Output System

Every command returns a typed result object. The output layer formats it based on context:

```typescript
type OutputOptions = {
  format: 'json' | 'table' | 'plain'; // explicit --output flag
  json: boolean; // --json shorthand
  isTTY: boolean; // auto-detected
};

// Resolution: --json > --output > auto-detect (TTY=table, pipe=json)
```

JSON envelope (all JSON output wrapped consistently):

```json
{
  "data": [ ... ],
  "meta": {
    "total": 42,
    "project": "my-project",
    "environment": "production"
  }
}
```

## Complete Command Reference

### CLI: `@spotify-confidence/cli`

#### Tier 1 — Core (ship first)

##### Auth & Identity

| Command                               | Description                                       |
| ------------------------------------- | ------------------------------------------------- |
| `confidence login [--profile <name>]` | Browser OAuth login (PKCE). Stores token locally. |
| `confidence logout`                   | Clear stored credentials.                         |
| `confidence whoami`                   | Show current user, org, region, token expiry.     |

##### Configuration

| Command                               | Description                |
| ------------------------------------- | -------------------------- |
| `confidence config set <key> <value>` | Set persistent preference. |
| `confidence config get <key>`         | Read a config value.       |
| `confidence config list`              | Show all config values.    |
| `confidence config reset`             | Reset to defaults.         |

Config keys: `project`, `environment`, `output`, `profile`, `ide`.
Storage: `~/.config/confidence/config.json` (per-profile).

##### Feature Flags

| Command                                               | Description                                              |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `confidence flags list`                               | List all flags in project.                               |
| `confidence flags get <flag-key>`                     | Get flag details (variants, targeting, status).          |
| `confidence flags create <flag-key>`                  | Create a new flag. Prompts for variants if not provided. |
| `confidence flags update <flag-key>`                  | Update flag description/variants.                        |
| `confidence flags toggle <flag-key> --on\|--off`      | Enable/disable a flag in an environment.                 |
| `confidence flags resolve <flag-key> [--context k=v]` | Resolve flag value for given context.                    |
| `confidence flags target <flag-key>`                  | View/update targeting rules.                             |
| `confidence flags archive <flag-key>`                 | Archive a flag.                                          |

#### Tier 2 — Product Completeness

##### Experiments

| Command                                | Description                      |
| -------------------------------------- | -------------------------------- |
| `confidence experiments list`          | List all experiments.            |
| `confidence experiments get <key>`     | Get experiment details.          |
| `confidence experiments results <key>` | Get experiment results/analysis. |
| `confidence experiments create <key>`  | Create a new experiment.         |
| `confidence experiments launch <key>`  | Start an experiment.             |
| `confidence experiments pause <key>`   | Pause a running experiment.      |
| `confidence experiments end <key>`     | End an experiment, pick winner.  |

##### Session Recordings

| Command                                          | Description                                 |
| ------------------------------------------------ | ------------------------------------------- |
| `confidence recordings status`                   | Check recording setup status.               |
| `confidence recordings setup`                    | Interactive SDK setup for recordings.       |
| `confidence recordings list`                     | List recent session recordings.             |
| `confidence recordings get <session-id>`         | Get recording details / playback URL.       |
| `confidence recordings config`                   | Show recording configuration.               |
| `confidence recordings config set <key> <value>` | Update config (sample-rate, masking, etc.). |

##### Event Tracking

| Command                                                   | Description                                    |
| --------------------------------------------------------- | ---------------------------------------------- |
| `confidence events list`                                  | List defined event types/schemas.              |
| `confidence events get <event-name>`                      | Get event schema details.                      |
| `confidence events track <event-name> [--properties k=v]` | Send a test event.                             |
| `confidence events create <event-name>`                   | Define a new event type/schema.                |
| `confidence events validate`                              | Validate local instrumentation against schema. |

##### Projects & Environments

| Command                                  | Description                            |
| ---------------------------------------- | -------------------------------------- |
| `confidence projects list`               | List all accessible projects.          |
| `confidence projects get <project-id>`   | Get project details.                   |
| `confidence environments list`           | List environments for current project. |
| `confidence environments get <env-name>` | Get environment details.               |

#### Tier 3 — Developer Experience

##### Documentation & Search

| Command                          | Description                                         |
| -------------------------------- | --------------------------------------------------- |
| `confidence docs search <query>` | Search Confidence docs (via `confidence-docs` MCP). |
| `confidence docs open <topic>`   | Open docs page in browser.                          |

##### SDK & Integration

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `confidence sdk install` | Detect framework, install correct SDK package. |
| `confidence sdk setup`   | Generate SDK initialization code.              |
| `confidence sdk status`  | Check SDK installation and version.            |

##### Agent & MCP Integration

| Command                     | Description                            |
| --------------------------- | -------------------------------------- |
| `confidence mcp install`    | Configure MCP servers for current IDE. |
| `confidence mcp status`     | Check MCP server connection status.    |
| `confidence mcp uninstall`  | Remove MCP server configuration.       |
| `confidence agents install` | Install AGENTS.md into project.        |
| `confidence agents update`  | Update agent instructions to latest.   |

##### Migration

| Command                         | Description                              |
| ------------------------------- | ---------------------------------------- |
| `confidence migrate detect`     | Scan project for competing providers.    |
| `confidence migrate <provider>` | AI-assisted migration from a competitor. |

##### Meta

| Command                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| `confidence --version`  | Show CLI version.                           |
| `confidence --help`     | Show help with examples.                    |
| `confidence update`     | Self-update to latest version.              |
| `confidence completion` | Generate shell completions (bash/zsh/fish). |

#### Global Flags

| Flag                   | Description                         |
| ---------------------- | ----------------------------------- |
| `--json`               | Force JSON output.                  |
| `--output <format>`    | `json`, `table`, or `plain`.        |
| `--project <id>`       | Override project (from config).     |
| `--environment <name>` | Override environment (from config). |
| `--profile <name>`     | Use named auth profile.             |
| `--no-color`           | Disable colors.                     |
| `--dry-run`            | Preview without executing.          |
| `--debug`              | Verbose/diagnostic output.          |

### Quickstart: `@spotify-confidence/quickstart`

Unchanged. The wizard remains available via:

```bash
npx @spotify-confidence/quickstart
# or, if installed globally:
confidence-quickstart
```

| Command                                                          | Description                              |
| ---------------------------------------------------------------- | ---------------------------------------- |
| `confidence-quickstart`                                          | Launch the interactive TUI setup wizard. |
| `confidence-quickstart --goals feature-flags,session-recordings` | Pre-select goals.                        |
| `confidence-quickstart --framework react`                        | Pre-select framework.                    |

## Implementation Phases

### Phase 0 — Monorepo Scaffolding (3–4 days)

**Goal:** Convert the repo to a pnpm monorepo with six packages (`shared-kernel`, `utils`, `eslint-config`, `core`, `testing`, `quickstart`). The CLI package is **not** scaffolded in this phase — it is added in Phase 1 when CLI development begins. Extract shared code, flatten the quickstart UI path, verify all tests (including e2e) pass, and update agent/skill documentation.

#### 0a. Monorepo structure

- [ ] Update `pnpm-workspace.yaml` to declare `packages/*`
- [ ] Create `packages/shared-kernel/`, `packages/utils/`, `packages/eslint-config/`, `packages/core/`, `packages/testing/`, `packages/quickstart/` directories
- [ ] Create `packages/shared-kernel/package.json` — `"name": "@spotify-confidence/shared-kernel"`, `"private": true`, no runtime dependencies
- [ ] Create `packages/utils/package.json` — `"name": "@spotify-confidence/utils"`, `"private": true`, may depend on `shared-kernel`
- [ ] Create `packages/eslint-config/package.json` — `"name": "@spotify-confidence/eslint-config"`, `"private": true`, with `eslint`, `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-react-hooks` as dependencies
- [ ] Create `packages/core/package.json` — `"name": "@spotify-confidence/core"`, `"private": true`, depends on `shared-kernel` and `utils`
- [ ] Create `packages/testing/package.json` — `"name": "@spotify-confidence/testing"`, `"private": true`, depends on `core`
- [ ] Create `packages/quickstart/package.json` — copy from root `package.json`, keep `"name": "@spotify-confidence/quickstart"`, depends on `core`, `shared-kernel`, `utils`; devDepends on `testing` and `eslint-config`
- [ ] Move root-level config files (`.commitlintrc.json`, `.lintstagedrc.json`, `.husky/`) to root, create per-package `tsconfig.json` files that extend a shared root `tsconfig.base.json`
- [ ] Create root `package.json` with `"private": true`, workspace scripts (`build`, `test`, `lint`, `typecheck`, `qa`), and shared devDependencies
- [ ] Set up root `.prettierignore` with `**/dist` to ignore dist directories in all packages

#### 0b. Extract shared-kernel, utils, and eslint-config

- [ ] Move `src/shared-kernel/types.ts` → `packages/shared-kernel/src/types.ts`
- [ ] Move `src/shared-kernel/index.ts` → `packages/shared-kernel/src/index.ts`
- [ ] Set up `packages/shared-kernel/tsconfig.json` with `composite: true`
- [ ] Move `src/lib/noop.ts` → `packages/utils/src/noop.ts`
- [ ] Move `src/lib/prompt-utils.ts` → `packages/utils/src/prompt-utils.ts`
- [ ] Create `packages/utils/src/index.ts` barrel export
- [ ] Set up `packages/utils/tsconfig.json` with `composite: true`
- [ ] Extract ESLint config from root `eslint.config.js` into `packages/eslint-config/index.js` — export the shared `tseslint.config(...)` with TS recommended, React Hooks, and Prettier rules
- [ ] Create per-package `eslint.config.js` files that import and extend from `@spotify-confidence/eslint-config`

#### 0c. Extract shared code into `packages/core/`

- [ ] Split `src/lib/` into cohesive modules under `packages/core/src/` (excluding files already moved to `shared-kernel` or `utils`):
  - `auth.ts` + `callback-pages.ts` → `packages/core/src/auth/`
  - `telemetry.ts` + `session.ts` → `packages/core/src/telemetry/`
  - `exec.ts` + `resolve-bin.ts` → `packages/core/src/exec/`
  - `env.ts` + `fs.ts` + `system-check.ts` → `packages/core/src/system/`
  - `meta.ts` + `sdk-options.ts` → `packages/core/src/sdk/`
  - `constants.ts` → `packages/core/src/constants.ts`
- [ ] Move `src/frameworks/` → `packages/core/src/frameworks/`
- [ ] Move `src/integrations/` → `packages/core/src/integrations/`
- [ ] Move `src/providers/` → `packages/core/src/providers/`
- [ ] Create `packages/core/src/index.ts` barrel export
- [ ] Set up `packages/core/tsconfig.json` with path aliases (`@auth/*`, `@telemetry/*`, `@exec/*`, `@system/*`, `@sdk/*`, `@frameworks/*`, `@integrations/*`, `@providers/*`, `@mcp-client/*`) and `composite: true`
- [ ] Configure `packages/core/` build — `tsc` with project references (no bundling needed for a private workspace package)
- [ ] Move relevant tests from `__tests__/lib/`, `__tests__/integrations/`, `__tests__/providers/` into `packages/core/__tests__/`

#### 0c½. Extract test infrastructure into `packages/testing/`

- [ ] Move `__tests__/msw/` → `packages/testing/src/msw/`
- [ ] Move `__tests__/shared/` → `packages/testing/src/shared/`
- [ ] Create `packages/testing/src/index.ts` barrel export
- [ ] Set up `packages/testing/tsconfig.json`
- [ ] Configure `packages/testing/` build — `tsc` with `composite: true`

#### 0d. Move quickstart into `packages/quickstart/`

- [ ] Move `bin/cli.ts` → `packages/quickstart/bin/cli.ts`
- [ ] Move `src/commands/` → `packages/quickstart/src/commands/`
- [ ] Move `src/features/` → `packages/quickstart/src/features/`
- [ ] Flatten `src/ui/tui/` → `packages/quickstart/src/ui/` — move all contents of `src/ui/tui/` (App.tsx, screens/, components/, hooks/, lib/, theme/, store.ts, router.ts, screen-registry.tsx, screen-transitions.ts, styles.ts, start-tui.ts) directly into `packages/quickstart/src/ui/`, eliminating the `tui/` nesting level. Remove the old `src/ui/index.ts` re-export file.
- [ ] Update all internal imports within quickstart:
  - `@ui/tui/*` → `@ui/*` (path alias now points to `src/ui/` directly)
  - `@shared-kernel/*` → `import from '@spotify-confidence/shared-kernel'`
  - `@lib/noop` / `@lib/prompt-utils` → `import from '@spotify-confidence/utils'`
  - Other `@lib/*` imports → `import from '@spotify-confidence/core'`
- [ ] Move `tsdown.config.ts` → `packages/quickstart/tsdown.config.ts` (update entry/output paths)
- [ ] Move `vitest.config.ts`, `vitest.config.e2e.ts` → `packages/quickstart/`
- [ ] Move `__tests__/ui/`, `__tests__/features/`, `__tests__/commands/`, `__tests__/e2e/` → `packages/quickstart/__tests__/`
- [ ] Update `packages/quickstart/tsconfig.json` path aliases (`@commands/*`, `@features/*`, `@ui/*` → `src/ui/*`)
- [ ] Update `tsdown.config.ts` paths for the steps `.md` copy

#### 0e. Verify everything works

- [ ] `pnpm install` succeeds from root
- [ ] `pnpm --filter @spotify-confidence/shared-kernel build` succeeds
- [ ] `pnpm --filter @spotify-confidence/utils build` succeeds
- [ ] `pnpm --filter @spotify-confidence/core build` succeeds
- [ ] `pnpm --filter @spotify-confidence/testing build` succeeds
- [ ] `pnpm --filter @spotify-confidence/quickstart build` succeeds
- [ ] `pnpm --filter @spotify-confidence/core test` — all core tests pass
- [ ] `pnpm --filter @spotify-confidence/quickstart test` — all quickstart unit/integration tests pass
- [ ] `pnpm --filter @spotify-confidence/quickstart test:e2e` — all e2e tests pass
- [ ] `pnpm --filter @spotify-confidence/quickstart typecheck` passes
- [ ] `pnpm lint` — lint passes across all packages (via shared eslint-config)
- [ ] The quickstart binary still works: `node packages/quickstart/dist/bin/cli.js` launches the TUI
- [ ] Update AGENTS.md to reflect new monorepo architecture (package paths, dependency rules, development commands)
- [ ] Update CLAUDE.md to reflect new monorepo architecture
- [ ] Update all skills in `.claude/skills/` to reference new package paths (e.g., `packages/quickstart/src/ui/` instead of `src/ui/tui/`, cross-package imports via npm names instead of path aliases)
- [ ] Update CI workflows (`.github/workflows/`) for monorepo (build/test all packages)
- [ ] Update release-please config for multi-package releases

### Phase 1 — Scaffold CLI, Auth & Config (2–3 days)

**Goal:** Scaffold the CLI package, then implement `login`, `logout`, `whoami`, and persistent config end-to-end.

#### 1a. Scaffold CLI package

- [ ] Create `packages/cli/package.json` — `"name": "@spotify-confidence/cli"`, `"bin": { "confidence": "dist/bin/cli.js" }`, depends on `core`, `shared-kernel`, `utils`; devDepends on `testing`, `eslint-config`
- [ ] Create `packages/cli/bin/cli.ts` — yargs root with subcommand groups
- [ ] Create `packages/cli/src/commands/index.ts` — command registry
- [ ] Create `packages/cli/src/output/` — JSON envelope, table formatter, TTY/pipe detection
- [ ] Wire global flags (`--json`, `--output`, `--project`, `--environment`, `--profile`, `--debug`)
- [ ] Set up `packages/cli/tsconfig.json` with path aliases (`@commands/*`, `@features/*`, `@output/*`, `@api/*`)
- [ ] Set up `packages/cli/tsdown.config.ts`
- [ ] Set up `packages/cli/vitest.config.ts`
- [ ] Set up `packages/cli/eslint.config.js` extending `@spotify-confidence/eslint-config`
- [ ] Add `packages/cli` to release-please config (`release-please-config.json` and `.release-please-manifest.json`)
- [ ] Verify `pnpm --filter @spotify-confidence/cli build` succeeds

#### 1b. Auth & Config

- [ ] Migrate token storage in `packages/core/src/auth/authenticate.ts`: `tmpdir()` → `~/.config/confidence/credentials.json` (mode `0o600`)
- [ ] One-time migration: if tokens exist in `tmpdir()` but not in `~/.config/confidence/`, copy them over and delete the old files
- [ ] `confidence login` — reuse `core`'s `authenticate()`, add `--profile` support
- [ ] `confidence logout` — clear token files, respect `--profile`
- [ ] `confidence whoami` — decode JWT, display user/org/region/expiry, table + JSON output
- [ ] Create `packages/cli/src/features/config/config.ts` — read/write `~/.config/confidence/config.json`
- [ ] `confidence config set|get|list|reset`
- [ ] CI auth path: `CONFIDENCE_TOKEN` env var → skip browser login
- [ ] Multi-profile: `~/.config/confidence/profiles/<name>/` token storage
- [ ] Tests for auth commands (mock OAuth flow), config persistence, and token migration

### Phase 2 — MCP Client & Flags CRUD (3–4 days)

**Goal:** The flagship resource commands work against MCP servers.

- [ ] Create `packages/core/src/mcp-client/` — programmatic MCP client that calls `confidence-flags` server (in core so it's reusable across packages)
- [ ] Implement MCP tool invocation: format request → HTTP POST → parse response
- [ ] Export MCP client from `@spotify-confidence/core`
- [ ] Create `packages/cli/src/api/` — REST API fallback client for when MCP is unavailable
- [ ] `confidence flags list` — call MCP `list-flags` tool, format as table/JSON
- [ ] `confidence flags get <key>` — call MCP `get-flag` tool
- [ ] `confidence flags create <key>` — call MCP `create-flag` tool, interactive prompts for variants
- [ ] `confidence flags update <key>`
- [ ] `confidence flags toggle <key> --on|--off` — call MCP toggle/enable/disable tool
- [ ] `confidence flags resolve <key> --context k=v` — call MCP `resolve-flag` tool
- [ ] `confidence flags target <key>` — call MCP targeting tool
- [ ] `confidence flags archive <key>` — call MCP `archive-flag` tool
- [ ] Interactive fallback: if required args are missing, prompt with inquirer-style prompts
- [ ] Tests for each command (mock MCP responses)

### Phase 3 — Experiments & Events (3–4 days)

**Goal:** Complete the core resource commands.

- [ ] `confidence experiments list|get|create|results|launch|pause|end`
- [ ] `confidence events list|get|track|create|validate`
- [ ] `confidence projects list|get`
- [ ] `confidence environments list|get`
- [ ] Same MCP-first pattern as flags
- [ ] Interactive prompts for `create` commands
- [ ] Tests for each resource

### Phase 4 — Session Recordings (2–3 days)

**Goal:** Recordings management commands.

- [ ] Determine MCP tool surface for recordings (may need new MCP server or endpoints)
- [ ] `confidence recordings status` — check setup in current project
- [ ] `confidence recordings setup` — interactive SDK setup (reuse framework detection from `core`)
- [ ] `confidence recordings list` — list recent sessions
- [ ] `confidence recordings get <session-id>` — details + playback URL
- [ ] `confidence recordings config` — show/update sampling, privacy, masking config
- [ ] Tests

### Phase 5 — Agent & DX Commands (2–3 days)

**Goal:** Agent integration and developer experience polish.

- [ ] `confidence mcp install|status|uninstall` — reuse `core`'s `integrations/mcp/` logic
- [ ] `confidence agents install|update` — write AGENTS.md to project
- [ ] `confidence sdk install|setup|status` — reuse `core`'s `frameworks/` detection
- [ ] `confidence docs search|open` — delegate to `confidence-docs` MCP
- [ ] `confidence migrate detect` — reuse `core`'s `providers/` detection
- [ ] `confidence migrate <provider>` — invoke AI-assisted migration via Claude Code
- [ ] `confidence completion` — generate bash/zsh/fish completions (yargs built-in)
- [ ] `confidence update` — self-update via npm
- [ ] Dashboard links in output (e.g., "View flag: https://confidence.spotify.com/flags/...")
- [ ] Contextual `--help` with examples on every subcommand
- [ ] Tests

### Phase 6 — Polish & Release (2 days)

**Goal:** Production-ready releases.

- [ ] End-to-end testing of full CLI command surface
- [ ] Error messages with actionable hints (not stack traces)
- [ ] Update README.md with new CLI documentation
- [ ] Update all AGENTS.md / skill files for monorepo architecture
- [ ] Publish `@spotify-confidence/cli@1.0.0` to npm
- [ ] Publish updated `@spotify-confidence/quickstart` (with core dependency) — minor version bump, no breaking changes

## Timeline

| Phase     | Scope                         | Estimate                      | Parallelizable      |
| --------- | ----------------------------- | ----------------------------- | ------------------- |
| Phase 0   | Monorepo scaffolding (no CLI) | 3–4 days                      | —                   |
| Phase 1   | Scaffold CLI + auth & config  | 2–3 days                      | —                   |
| Phase 2   | MCP client & flags            | 3–4 days                      | —                   |
| Phase 3   | Experiments & events          | 3–4 days                      | Yes (after Phase 2) |
| Phase 4   | Session recordings            | 2–3 days                      | Yes (after Phase 2) |
| Phase 5   | Agent & DX commands           | 2–3 days                      | Yes (after Phase 2) |
| Phase 6   | Polish & release              | 2 days                        | —                   |
| **Total** |                               | **~3.5–5 weeks** (1 engineer) |                     |

Phases 3, 4, and 5 can run in parallel across engineers once Phase 2 establishes the MCP client pattern. With 2–3 engineers, total wall-clock time shrinks to ~2.5 weeks.

## Risks & Open Questions

1. **MCP tool surface for recordings & events.** The existing MCP servers (`confidence-flags`, `confidence-docs`) may not cover all recording/event operations. May need new MCP endpoints or a new `confidence-recordings` server.
2. **REST API availability.** The fallback API client needs documented, stable REST endpoints for all operations. Need to verify API coverage matches the planned command surface.
3. **Auth token storage location.** **Decision: migrate to `~/.config/confidence/`.** Currently uses `tmpdir()` which is ephemeral (tokens lost on reboot). The core package stores tokens in `~/.config/confidence/credentials.json` (mode `0o600`). Phase 1 (Auth & Config) includes a one-time migration: on first run, if tokens exist in `tmpdir()` but not in `~/.config/confidence/`, copy them over and delete the old files. Both the CLI and quickstart share this auth path via `core`.
4. **Core package build strategy.** **Decision: `tsc` with `composite: true` and project references.** The `core`, `shared-kernel`, `utils`, and `testing` packages are private and consumed only within the workspace — no bundling needed. `tsc` composite gives fast incremental builds and project references.
5. **yargs subcommand nesting depth.** ~~`confidence recordings config set <key> <value>` is 3 levels deep.~~ **Verified:** yargs handles 3-level nesting cleanly via nested `.command()` calls inside builder functions. Help output is contextual at each level, `demandCommand()` works correctly, positional args resolve as expected. No flattening needed.
