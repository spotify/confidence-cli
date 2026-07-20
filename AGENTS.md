# Confidence Wizard

CLI wizard for setting up and integrating [Confidence](https://confidence.spotify.com/) with user projects.

## Architecture

The project has five decoupled domains:

- **`src/commands/`** — CLI command definitions (yargs-based). Currently: default (launches TUI) and help.
- **`src/frameworks/`** — Framework integration configs. One subdir per framework (react, nextjs, node). Each exports a `FrameworkConfig` with detection, SDK package, and docs URL.
- **`src/integrations/`** — IDE integration strategies. One subdir per supported IDE (claude, cursor, codex). Each exports an `IdeIntegration` object implementing the strategy pattern. Also contains IDE-agnostic MCP, plugin, and chat-session logic.
- **`src/providers/`** — Provider detection for competing feature flag platforms (Statsig, Eppo, PostHog, Optimizely). One subdir per provider.
- **`src/ui/`** — Terminal UI built with Ink (React for CLIs). Contains screens, components, theme, store, and router.

Supporting modules:

- **`src/lib/`** — Shared constants, session types, and core logic.
- **`src/env.ts`** — Environment variable access with allowlist.

## Key Patterns

- **Reactive state**: `WizardStore` uses nanostores atoms. Screens subscribe via `useSyncExternalStore`.
- **Screen navigation**: `WizardRouter` uses a state-machine transition map (`screen-transitions.ts`) with a history stack for back navigation. Screens navigate via the type-safe `useNavigation(ScreenId.X)` hook, calling `nav.to('event')` or `nav.back()`. Adding a branch is one new edge in the transition map.
- **Screen slices**: Every screen is organized as a slice — a subdirectory under `screens/` containing the component, a barrel `index.ts`, and collocated `log-messages.ts` + `telemetry-events.ts` for screen-specific log and telemetry event factories (e.g. `screens/system-check/`). Slices with side-effect hooks also contain their hooks. Shared log/telemetry factories (e.g. `skipped()`, `screenEntered()`) stay in `tui/lib/`. Slices that compute initial state at mount time have a collocated `useInitial*` hook (see `wizard-architecture` skill for details). To add a screen: create subdir in `screens/`, add component + barrel + `log-messages.ts` + `telemetry-events.ts`, add `ScreenId` enum value, register in `screen-registry.tsx`, add transitions in `screen-transitions.ts`.
- **IDE strategy pattern**: Each IDE (Claude Code, Cursor, Codex) is a self-contained `IdeIntegration` object under `src/integrations/`. Adding a new IDE means creating one subdir and adding it to the registry — no changes to other IDE dirs or consumers.
- **No product knowledge in TUI**: The TUI is a generic wizard shell. Confidence-specific domain logic belongs in the Claude Code Skill and MCP tools, not in the UI layer.

## Development

```bash
pnpm install
pnpm try          # Run the wizard locally via tsx
pnpm test         # Run vitest (unit + integration)
pnpm test:e2e     # Build + run e2e tests (node-pty)
pnpm lint         # ESLint + Prettier check
pnpm typecheck    # TypeScript type checking
pnpm qa           # Run all checks: typecheck + lint + test
pnpm build        # Build for distribution
```

## Tech Stack

- TypeScript (strict mode, NodeNext modules)
- Ink 6 + React 19 (TUI rendering)
- @inkjs/ui (Select, TextInput, Spinner, etc.)
- nanostores (reactive state)
- yargs (CLI parsing)
- vitest (testing)
- tsdown (bundling)

## Confidence MCP Tools

The wizard works alongside Confidence MCP servers:

- `confidence-flags` — Feature flag management (create, list, resolve, target, archive)
- `confidence-docs` — Documentation search and SDK integration guides

These are accessed via the Claude Code Skill, not directly from the TUI.

## Troubleshooting

### E2E tests fail to install or build

E2E tests use `node-pty` to drive the TUI in a real terminal. This native module requires platform-specific build tools. If `pnpm install` fails on `node-pty`, install the prerequisites listed at https://github.com/microsoft/node-pty#dependencies.

### E2E tests fail with `posix_spawnp failed`

The stable `node-pty` release (v1.1.0) doesn't ship prebuilt binaries for Node.js v26+. The project uses `node-pty@1.2.0-beta.14` which includes updated Node-API bindings for newer Node versions. If you hit this error on a newer Node version, ensure the beta is installed. On CI with Node 24, the stable release works fine.

## Conventions

- Use path aliases (`@commands/`, `@frameworks/`, `@integrations/`, `@providers/`, `@ui/`, `@lib/`) for cross-domain imports. Keep relative imports within the same domain.
- Use `@inkjs/ui` components over standalone `ink-*` packages.
- Screens go in `src/ui/tui/screens/` (as slices or flat files), reusable components in `components/`.
- Shared modules (`hooks/`, `lib/`, `components/`) must never import from screen slices. If a type is needed by both, put it in `tui/lib/`.
- Framework integrations each get their own subdir under `src/frameworks/`.
- All state mutations go through `WizardStore` setters so reactivity works.
- Enums for screen IDs, not string literals.
- Prefer `AbortController` for removing event listeners instead of manual `removeEventListener`.
- All commits must follow Conventional Commits. The `commit-msg` hook enforces this via commitlint.
- Run `pnpm qa` before pushing to ensure CI will pass.
- When writing or modifying code, always use the `wizard-architecture` skill first to load the project's architecture and coding conventions.
- When writing or changing tests, always use the `wizard-testing` skill first to load the project's testing guidelines and conventions.
- When making commits or working with the CI/release pipeline, use the `wizard-development-harness` skill for guidelines.

## Skills (Mandatory)

Before making any changes, agents MUST load the relevant skill(s) from `.claude/skills/`. These skills contain the authoritative guidelines for this project — architecture constraints, coding conventions, testing philosophy, and development harness rules. Skipping them leads to guideline violations.

| Skill                        | When to load            | Key rules                                                                                                                                                                                                                          |
| ---------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wizard-architecture`        | Any code change         | Path aliases for cross-domain imports, dependency direction, dry-run separation, initialization hooks, TypeScript style (`type` over `interface`, `satisfies never` in switch defaults, object params for 4+ args), module exports |
| `wizard-testing`             | Any test change         | Observable behavior only, AAA pattern, `sut` naming, `using` for disposables, `waitFor` over `delay`, MSW for HTTP mocks, `describe` blocks use consumer-perspective naming (`when…`/`given…`)                                     |
| `wizard-ink-tui`             | Any TUI/screen change   | Ink rendering model, `@inkjs/ui` over standalone packages, `Colors`/`Icons`/`HAlign`/`VAlign` from `styles.ts`, named functions in `useEffect`                                                                                     |
| `wizard-integrations`        | IDE integration changes | Strategy pattern, self-contained IDE subdirs, adding new IDEs, MCP/chat/plugin flows                                                                                                                                               |
| `wizard-development-harness` | Commits, CI, releases   | Conventional Commits, `pnpm qa` before push, pre-commit hooks, release-please                                                                                                                                                      |
| `wizard-workflows`           | Workflow changes        | Hash-pinned actions with version comments, minimal permissions, per-secret references                                                                                                                                              |
