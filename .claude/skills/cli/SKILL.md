---
name: cli
description: Structure, commands, output formatting, and conventions for the packages/cli/ package
version: '0.1'
---

# CLI Package

This skill covers the `packages/cli/` package — the `confidence` CLI binary for managing Confidence feature flags, events, session recordings, and configuration.

## Package Overview

The CLI wraps the quickstart TUI wizard and adds standalone commands for auth and config management. It is published as `@spotify-confidence/cli` and installs the `confidence` binary.

### Dependencies

- **Runtime**: `@spotify-confidence/quickstart`, `yargs`
- **Dev**: `@spotify-confidence/core`, `shared-kernel`, `testing`, `eslint-config`

### Build

tsdown bundles `core` and `shared-kernel` into the binary. `quickstart` stays external (dynamically imported at runtime). Target: Node 24+ ESM.

## Directory Structure

```
packages/cli/
├── bin/cli.ts              # Entry point — yargs CLI
├── src/
│   ├── commands/           # Command definitions
│   │   ├── index.ts        # Barrel
│   │   ├── types.ts        # GlobalFlags type
│   │   ├── login.ts        # OAuth login
│   │   ├── logout.ts       # Clear credentials
│   │   ├── whoami.ts       # Show current identity
│   │   ├── config.ts       # config set/get/list/reset
│   │   ├── flags.ts        # flags setup
│   │   ├── events.ts       # events setup
│   │   ├── recordings.ts   # recordings setup
│   │   └── quickstart.ts   # Launch TUI wizard
│   ├── features/           # Feature implementations
│   │   ├── config/         # Re-exports from core
│   │   └── quickstart/     # Launch helper with feature mapping
│   └── output/             # Output formatters
│       ├── detect.ts       # resolveFormat()
│       ├── json.ts         # formatJson()
│       └── table.ts        # formatTable()
└── __tests__/              # Tests
```

## Path Aliases

| Alias         | Target           |
| ------------- | ---------------- |
| `@commands/*` | `src/commands/*` |
| `@features/*` | `src/features/*` |
| `@output/*`   | `src/output/*`   |
| `@api/*`      | `src/api/*`      |

## Command Architecture

Each command exports an object with the yargs command shape:

```ts
export const exampleCommand = {
  command: 'example',
  describe: 'One-line description',
  builder(yargs: Argv) { ... },    // optional — for subcommands or extra options
  async handler(argv: Record<string, unknown>) { ... },
};
```

### Global Options

All commands receive these from the root yargs instance:

| Flag            | Type    | Purpose                          |
| --------------- | ------- | -------------------------------- |
| `--json`        | boolean | Force JSON output                |
| `--output`      | string  | Output format (json/table/plain) |
| `--project`     | string  | Override project from config     |
| `--environment` | string  | Override environment             |
| `--profile`     | string  | Named auth profile               |
| `--dry-run`     | boolean | Preview without executing        |
| `--debug`       | boolean | Verbose output                   |

### Command Types

**Standalone commands** — directly perform their action:

- `login`, `logout`, `whoami`, `config`

**Setup commands** — delegate to the quickstart TUI with pre-selected features:

- `flags setup`, `events setup`, `recordings setup`

**TUI launcher** — launches the full interactive wizard:

- `quickstart`

## Output Formatting

### Format Resolution (`resolveFormat`)

Priority: `--json` flag → `--output` flag → TTY detection (TTY → table, pipe → JSON).

### JSON Envelope (`formatJson`)

All JSON output wraps data in a standard envelope:

```json
{
  "data": { ... },
  "meta": { ... }
}
```

The `meta` field is omitted when empty.

### Table Formatter (`formatTable`)

Renders rows with dynamically-sized columns. Supports fixed-width overrides per column. Uses Unicode box-drawing separators.

## Quickstart Integration

The `launchQuickstart()` helper in `src/features/quickstart/launch.ts`:

1. Maps feature names to goal IDs: `flags` → `feature-flags`, `events` → `event-tracking`, `recordings` → `session-recordings`
2. Dynamically imports `startTui` from `@spotify-confidence/quickstart`
3. Passes through `--dir`, `--dry-run`, `--debug`, and `--no-telemetry` options

## Config Feature

The `config` command manages persistent key-value configuration stored in `$CONFIDENCE_CONFIG_DIR/config.json`. Valid keys: `project`, `environment`, `output`, `profile`, `ide`. Implementation delegates to `@spotify-confidence/core`.

## Hard Constraints

- Commands must not contain UI rendering logic — delegate to quickstart for TUI flows.
- Auth logic lives in `@spotify-confidence/core`, not in command handlers.
- Output formatting goes through `src/output/` — commands never call `JSON.stringify` directly.
- The CLI must not import from quickstart's internal modules — only from its public `startTui` export.

## Development

```bash
pnpm --filter @spotify-confidence/cli try       # Run CLI locally via tsx
pnpm --filter @spotify-confidence/cli test      # Run unit tests
pnpm --filter @spotify-confidence/cli build     # Build for distribution
pnpm --filter @spotify-confidence/cli qa        # Full quality check
```
