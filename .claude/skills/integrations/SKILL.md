---
name: integrations
description: IDE integration strategy pattern and guidelines for the packages/core/src/integrations/ module
version: '0.4'
---

# IDE Integrations Guidelines

Structure, constraints, and conventions for IDE integrations in `packages/core/src/integrations/`.

## Strategy Pattern

Each supported IDE (Claude Code, Cursor, Codex) is a self-contained `IdeIntegration` object in its own subdirectory. This eliminates per-IDE `switch` statements and makes adding a new IDE a single-directory change.

Every IDE implements the `IdeIntegration` interface: `id`, `name`, `launchChat()`, `runOnboarding()`, `detectPlugins()`, `installPlugins()`, `detectMcpStatuses()`, `connectMcpServer()`. See the type definition in `types.ts` for the full contract.

Thin orchestrators (`chat.ts`, `plugins.ts`) resolve the strategy via `getIntegration(ide)` and delegate.

## Hard Constraints

- **IDE subdirs are self-contained** — no imports from other IDE subdirs. Each is split into `paths.ts`, `plugins.ts`, `mcp.ts`, and `index.ts`. May import from `../types.js`, `../mcp/servers.js`, `../shared.js` — never from `../registry.js` or each other.
- **No switch-on-IDE outside strategies** — code outside `integrations/` must not branch on `IdeId`. Use `getIntegration(ide)` and call strategy methods.
- **Dependency direction** — integrations imports from `shared-kernel` and other core modules, never from `quickstart/` or `cli/`.
- **Clean-dev script** — when changing MCP-related code, verify `scripts/clean-dev-env.sh` still cleans up correctly. Update it when adding a new IDE.

## Adding a New IDE

1. Create `packages/core/src/integrations/<ide-name>/index.ts` with `paths.ts`, `plugins.ts`, `mcp.ts`
2. Export a `const <name>Integration: IdeIntegration`
3. Add to the `INTEGRATIONS` array in `registry.ts`
4. Update `scripts/clean-dev-env.sh`

No other source files need changes.

## Codex Runtime Constraints

- **Shell environment policy** — always pass `-c 'shell_environment_policy.inherit="core"'` in Codex `exec` spawn args, otherwise `npm install` times out on corporate networks.
- **Event batching** — Codex `exec --json` only emits `item.completed` events (no incremental deltas). Status lines only appear after a full message turn. Claude Code and Cursor stream incrementally.
