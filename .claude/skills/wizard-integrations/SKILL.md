---
name: integrations
description: IDE integration strategy pattern and guidelines for the Confidence Wizard CLI project
version: '0.2'
---

# IDE Integrations Guidelines

This skill defines the structure, constraints, and conventions for IDE integrations in the Confidence Wizard CLI. Follow these when adding, modifying, or reviewing IDE-related code.

## Purpose

The `src/integrations/` module encapsulates all IDE-specific behavior behind a strategy pattern. Each supported IDE (Claude Code, Cursor, Codex) has a self-contained implementation that conforms to a shared `IdeIntegration` interface. This eliminates per-IDE `switch` statements scattered across the codebase and makes adding a new IDE a single-directory change.

## Module Structure

```
src/integrations/
  types.ts              # IdeId, IdeIntegration strategy type, McpConnectOpts
  index.ts              # Barrel exports + registry re-exports
  registry.ts           # getIntegrations(), getIntegration() — the strategy registry
  chat.ts               # buildChatPrompt() + launchChatSession() orchestrator
  plugins.ts            # detectInstalledPlugins() + installPlugin() orchestrators
  shared.ts             # Reusable helpers: PLUGIN_SKILLS, installSkills(), hasConfidenceServers()
  claude/
    index.ts            # claudeIntegration — composes strategy from submodules
    paths.ts            # Config file and directory paths
    plugins.ts          # detectPlugins(), installPlugins()
    mcp.ts              # detectMcpStatuses(), connectMcpServer()
    onboarding.ts       # runOnboarding() — spawns the IDE's onboarding process
  cursor/
    index.ts, paths.ts, plugins.ts, mcp.ts, onboarding.ts  # Same structure
  codex/
    index.ts, paths.ts, plugins.ts, mcp.ts, onboarding.ts  # Same structure
  mcp/
    servers.ts          # MCP_SERVERS, McpServerName, McpServerStatus, verifyMcpServer(), helpers
    preference.ts       # loadMcpPreference(), persistMcpPreference()
    index.ts            # Barrel exports
```

## The Strategy Pattern

### `IdeIntegration` type

Every IDE exports a single `IdeIntegration` object with these methods:

- `id` — the `IdeId` string (`'claude' | 'cursor' | 'codex'`)
- `name` — human-readable label for UI display
- `launchChat(prompt, cwd)` — spawns a chat session in this IDE
- `runOnboarding(opts, callbacks)` — spawns the IDE's onboarding process with stdout/stderr streaming
- `detectPlugins(projectDir)` — checks if Confidence plugins are installed for this IDE
- `installPlugins(projectDir)` — installs MCP config and skills for this IDE
- `detectMcpStatuses(projectDir)` — detects MCP server connection statuses
- `connectMcpServer(opts)` — registers an MCP server for this IDE

Each IDE owns the full implementation of all these methods. Shared helpers (`verifyMcpServer`, `installSkills`, `hasConfidenceServers`) are imported from `mcp/servers.ts` and `shared.ts`.

### Shared types

`IdeId` is defined in `src/integrations/types.ts` — it belongs to the integrations module. `WizardSession` uses its own `ChosenIde` type (same string union, defined in `src/lib/session.ts`) to stay decoupled from the integrations module. This keeps the dependency direction clean: integrations never imports from lib/session for its own type definitions, and session never imports from integrations.

### Orchestrators

`chat.ts` and `plugins.ts` are thin orchestrators that resolve the IDE strategy and delegate:

- `launchChatSession(session, ide)` — builds prompt, calls `integration.launchChat()`
- `detectInstalledPlugins(projectDir)` — iterates all integrations, calls `i.detectPlugins()`
- `installPlugin(ide, projectDir)` — calls `getIntegration(ide).installPlugins()`

Consumers use orchestrators when they don't have the integration object, or use the strategy methods directly when they do.

## Hard Constraints

### IDE subdirs are self-contained

Each IDE subdirectory (`claude/`, `cursor/`, `codex/`) must be fully independent:

- No imports from other IDE subdirectories
- Each IDE subdir is split into `paths.ts`, `plugins.ts`, `mcp.ts`, and a slim `index.ts` that composes them
- IDE subdirs may import from `../types.js`, `../mcp/servers.js`, and `../shared.js` — never from `../registry.js` or each other

### No switch-on-IDE outside strategy implementations

All IDE-specific branching is encapsulated inside each strategy object. Code outside `src/integrations/` must not `switch` on `IdeId` or branch on IDE identity. Instead, call `getIntegration(ide)` and use the strategy methods.

### Dependency direction

```
integrations/index.ts       → registry, chat, plugins, mcp/
registry.ts                 → claude/, cursor/, codex/
chat.ts, plugins.ts         → registry.ts
claude/, cursor/, codex/    → types.ts, mcp/servers.ts, shared.ts (never registry or each other)
mcp/                        → (no internal integrations imports)
shared.ts                   → (no internal integrations imports)
```

The integrations module imports from `src/lib/` (for `IdeId`, `WizardSession`, constants). It never imports from `src/ui/` or `src/commands/`.

### Clean-dev script

When changing MCP-related code (config paths, server names, connection methods, permissions), verify that `scripts/clean-dev-env.sh` still correctly cleans up all IDE connections and artifacts. This script resets the local dev environment for clean-slate testing. If you add a new IDE, config path, or MCP registration method, update the script accordingly.

## Adding a New IDE

1. Create `src/integrations/<ide-name>/index.ts`
2. Export a `const <name>Integration: IdeIntegration` with all required methods
3. Add the import and entry to the `INTEGRATIONS` array in `src/integrations/registry.ts`
4. Update `scripts/clean-dev-env.sh` to clean the new IDE's config files and MCP entries
5. No other source files need to change — the registry, screens, and orchestrators all derive from the strategy

## Public API

The barrel `src/integrations/index.ts` exports:

- Types: `IdeId`, `IdeIntegration`, `McpConnectOpts`, `OnboardingOpts`, `OnboardingCallbacks`, `McpServerName`, `McpServerStatus`
- Registry: `getIntegrations()`, `getIntegration(id)`
- MCP: `MCP_SERVERS`, `allServersConnected()`, `getAvailableMcpServers()`, `verifyMcpServer()`, `loadMcpPreference()`, `persistMcpPreference()`
- Chat: `launchChatSession(session, ide)`
- Plugins: `detectInstalledPlugins(projectDir)`, `installPlugin(ide, projectDir)`

Only import from the barrel or from specific submodules — never reach into an IDE's `index.ts` directly from outside the integrations module.

## Coding Conventions

Follow all conventions from the `wizard-architecture` skill. Additionally:

- Use `type` over `interface` for all type definitions
- Strategy objects use `satisfies IdeIntegration` only if needed for type narrowing; otherwise the export type annotation is sufficient
- Private helpers within IDE subdirs should be plain functions, not methods on the strategy object
- The `connectMcpServer` method receives all server metadata via `McpConnectOpts` — it must not import `MCP_SERVERS` directly
