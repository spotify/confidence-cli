---
name: architecture
description: Monorepo structure, dependency graph, domain boundaries, and package-level constraints for the Confidence CLI project
version: '0.4'
---

# Architecture Guidelines

Structural rules, domain boundaries, and constraints for the Confidence CLI monorepo.

## Monorepo Structure

| Package                   | Published | Purpose                                                                                                  |
| ------------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `packages/shared-kernel/` | No        | Cross-domain types and `noop` helper                                                                     |
| `packages/eslint-config/` | No        | Shared ESLint config (base + react presets)                                                              |
| `packages/core/`          | No        | Shared infrastructure (auth, session, telemetry, exec, system, sdk, frameworks, integrations, providers) |
| `packages/testing/`       | No        | Test infrastructure (sub-paths: `/auth`, `/scaffold`, `/env`, `/terminal`, `/msw`, `/e2e`)               |
| `packages/quickstart/`    | Yes       | TUI wizard — `@spotify-confidence/quickstart`                                                            |
| `packages/cli/`           | Yes       | CLI — `@spotify-confidence/cli`                                                                          |

### Dependency Graph

```
shared-kernel ◄── core ◄── quickstart ◄── cli
     ▲
     └── testing
```

## Import Rules

**Cross-package** — always use npm package name:

```ts
import { authenticate } from '@spotify-confidence/core';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { buildTestJwt } from '@spotify-confidence/testing/auth';
```

**Intra-package** — use path aliases for cross-domain, relative for within-domain:

| Package    | Aliases                                                           |
| ---------- | ----------------------------------------------------------------- |
| quickstart | `@commands/*`, `@features/*`, `@ui/*`                             |
| cli        | `@commands/*`, `@features/*`, `@output/*`, `@api/*`               |
| core       | Relative imports in `src/`; tsconfig aliases in `__tests__/` only |

## Domain Boundaries

- **shared-kernel** — Types used by 3+ packages. Depends on nothing.
- **core** — Shared infrastructure. Must not import from quickstart, cli, or testing.
- **testing** — Test scaffolds. Depends on shared-kernel only.
- **quickstart** — TUI wizard. See `ink-tui` skill for UI details.
- **cli** — CLI binary. See `cli` skill for command architecture.

## Hard Constraints

### Dependency direction

```
cli          → quickstart, core, shared-kernel
quickstart   → core, shared-kernel
core         → shared-kernel
shared-kernel → nothing
```

No circular dependencies. No upward imports.

Within quickstart UI: `screen slices → hooks/, lib/, components/ → lib/ → nothing in ui/`

### No product knowledge in the TUI

The TUI is a generic wizard shell. Confidence-specific domain logic belongs in the Claude Code Skill and is delivered via MCP tools.

### Screen identification

Always use `ScreenId` enum values from `@spotify-confidence/core`. Never use raw strings.

### State mutations

All session state changes go through `WizardStore` setters. Never mutate the session object directly.

### UI component sourcing

Use `@inkjs/ui` components over standalone `ink-*` packages.
