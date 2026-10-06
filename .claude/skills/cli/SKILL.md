---
name: cli
description: Structure, commands, output formatting, and conventions for the packages/cli/ package
version: '0.3'
---

# CLI Package

The `packages/cli/` package — the `confidence` binary for managing Confidence feature flags, events, session recordings, and configuration. Published as `@spotify-confidence/cli`.

## Build

tsdown bundles `core` and `shared-kernel` into the binary. `quickstart` stays external (dynamically imported at runtime). Target: Node 24+ ESM.

## Command Architecture

Each command exports a yargs command object:

```ts
export const exampleCommand = {
  command: 'example',
  describe: 'One-line description',
  builder(yargs: Argv) { ... },
  async handler(argv: Record<string, unknown>) { ... },
};
```

For parent commands with subcommands, use `noop` from `@spotify-confidence/shared-kernel` as the empty builder, not `() => {}`.

### Command Types

- **Standalone** — `login`, `logout`, `whoami`, `config`, `update` — directly perform their action
- **API commands** — `flags`, `events`, `recordings`, `docs` — CRUD operations against Confidence APIs via `@network/*`
- **Integration** — `mcp`, `plugin`, `sdk`, `migrate` — manage IDE tooling and SDK setup
- **Setup** — `flags setup`, `events setup`, `recordings setup` — delegate to quickstart TUI with pre-selected features
- **TUI launcher** — `quickstart` — launches the full interactive wizard

### Path Aliases

`@commands/*`, `@features/*`, `@input/*`, `@output/*`, `@network/*`, `@utils/*`, `@meta` — use these for cross-domain imports within the CLI package.

## Output Formatting

All structured output goes through `src/output/`:

- **`resolveFormat()`** — priority: `--json` flag → `--output` flag → TTY detection (TTY → table, pipe → JSON)
- **`formatJson()`** — wraps data in `{ data, meta? }` envelope
- **`formatTable()`** — dynamically-sized columns with Unicode separators

Commands never call `JSON.stringify` directly.

## Quickstart Integration

`launchQuickstart()` in `src/features/quickstart/launch.ts` maps feature names to goal IDs (`flags` → `feature-flags`, etc.), dynamically imports `startTui` from `@spotify-confidence/quickstart`, and passes through CLI options.

## Hard Constraints

- Commands must not contain UI rendering logic — delegate to quickstart for TUI flows.
- Auth logic lives in `@spotify-confidence/core`, not in command handlers.
- The CLI must not import from quickstart's internal modules — only from its public `startTui` export.
- Use `noop` from `@spotify-confidence/shared-kernel` for empty yargs builders, not `() => {}`.
