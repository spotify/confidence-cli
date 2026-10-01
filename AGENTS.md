# Confidence Wizard

CLI wizard for setting up and integrating [Confidence](https://confidence.spotify.com/) with user projects.

## Monorepo Structure

pnpm workspace with five packages under `packages/`:

| Package                   | Published                              | Purpose                                                                                                                                                                                                |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/shared-kernel/` | No (private)                           | Cross-domain types (`AuthState`, `IdeId`, `OnboardingGoal`, etc.) and `noop`. No runtime dependencies.                                                                                                 |
| `packages/eslint-config/` | No (private)                           | Shared ESLint configuration. Exports base preset and `/react` preset with React Hooks rules.                                                                                                           |
| `packages/core/`          | No (private)                           | Shared infrastructure — auth, session, telemetry, exec, system, sdk, utils, constants, frameworks, integrations, providers. Depends on `shared-kernel`.                                                |
| `packages/testing/`       | No (private)                           | Test infrastructure — auth scaffolds, project scaffolds, env helpers, terminal helpers, MSW handlers. Sub-path exports: `/auth`, `/scaffold`, `/env`, `/terminal`, `/msw`. Depends on `shared-kernel`. |
| `packages/quickstart/`    | Yes (`@spotify-confidence/quickstart`) | Interactive TUI wizard. Depends on `core` and `shared-kernel`.                                                                                                                                         |

### Dependency graph

```
shared-kernel (types-only leaf)
    ▲
    ├── core (infrastructure)
    ├── testing (test scaffolds)
    └── quickstart (TUI wizard) ──► core
```

### packages/core/ modules

- **`auth/`** — OAuth PKCE flow + token persistence
- **`session/`** — WizardSession state, ScreenId enum, createSession
- **`telemetry/`** — Analytics + session tracking
- **`exec/`** — Running external commands (spawn, execFile, resolveBin)
- **`system/`** — Environment vars, filesystem helpers, system checks
- **`sdk/`** — SDK metadata + options
- **`utils/`** — Generic utilities (addIf, interpolate)
- **`constants.ts`** — Confidence URLs + env-derived values
- **`frameworks/`** — Framework detection (react, nextjs, node, go, java, kotlin, python, swift)
- **`integrations/`** — IDE integration strategies (claude, cursor, codex) + MCP, plugins, chat
- **`providers/`** — Provider detection (Statsig, Eppo, PostHog, Optimizely)

### packages/quickstart/ structure

- **`bin/cli.ts`** — Entry point (yargs, launches TUI)
- **`src/commands/`** — CLI command definitions (default, help)
- **`src/features/`** — Vertical feature slices (`onboarding/` prompt builder)
- **`src/ui/`** — Ink/React TUI (screens, components, hooks, theme, store, router)

## Key Patterns

- **Reactive state**: `WizardStore` uses nanostores atoms. Screens subscribe via `useSyncExternalStore`.
- **Screen navigation**: `WizardRouter` uses a state-machine transition map (`screen-transitions.ts`) with a history stack for back navigation. Screens navigate via the type-safe `useNavigation(ScreenId.X)` hook, calling `nav.to('event')` or `nav.back()`. Adding a branch is one new edge in the transition map.
- **Screen slices**: Every screen is a subdirectory under `src/ui/screens/` containing the component, a barrel `index.ts`, and collocated `log-messages.ts` + `telemetry-events.ts` + `actions.ts`. Slices with side-effect hooks also contain their hooks. Shared log/telemetry factories stay in `ui/lib/`. Slices that compute initial state at mount time have a collocated `useInitial*` hook. To add a screen: create subdir in `screens/`, add component + barrel + slice files, add `ScreenId` enum value, register in `screen-registry.tsx`, add transitions in `screen-transitions.ts`.
- **IDE strategy pattern**: Each IDE (Claude Code, Cursor, Codex) is a self-contained `IdeIntegration` object under `packages/core/src/integrations/`. Adding a new IDE means creating one subdir and adding it to the registry.
- **No product knowledge in TUI**: The TUI is a generic wizard shell. Confidence-specific domain logic belongs in the Claude Code Skill and MCP tools, not in the UI layer.

## Development

```bash
pnpm install                                          # Install all workspace deps
pnpm --filter @spotify-confidence/quickstart try      # Run the wizard locally via tsx
pnpm test                                             # Run all tests (core + quickstart)
pnpm test:e2e                                         # Build + run quickstart e2e tests
pnpm lint                                             # ESLint + Prettier check across all packages
pnpm typecheck                                        # TypeScript type checking across all packages
pnpm qa                                               # Run all checks: typecheck + lint + test
pnpm build                                            # Build all packages
```

Per-package commands:

```bash
pnpm --filter @spotify-confidence/core test           # Core unit tests only
pnpm --filter @spotify-confidence/quickstart test     # Quickstart unit tests only
pnpm --filter @spotify-confidence/quickstart build    # Build quickstart for distribution
```

## Tech Stack

- TypeScript (strict mode, NodeNext modules)
- Ink 7 + React 19 (TUI rendering)
- @inkjs/ui (Select, TextInput, Spinner, etc.)
- nanostores (reactive state)
- yargs (CLI parsing)
- vitest (testing)
- tsdown (bundling)
- pnpm workspaces (monorepo)

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

- **Cross-package imports** use npm package names: `import { authenticate } from '@spotify-confidence/core'`, `import type { IdeId } from '@spotify-confidence/shared-kernel'`.
- **Within quickstart**, use path aliases (`@commands/*`, `@features/*`, `@ui/*`) for cross-domain imports. Keep relative imports within the same domain.
- **Within core source** (`packages/core/src/`), use relative imports. Core's `__tests__/` may use tsconfig path aliases (`@auth/*`, `@integrations/*`, etc.).
- **Test imports** from `@spotify-confidence/testing` use sub-path exports: `@spotify-confidence/testing/auth`, `@spotify-confidence/testing/scaffold`, `@spotify-confidence/testing/env`, `@spotify-confidence/testing/terminal`.
- Use `@inkjs/ui` components over standalone `ink-*` packages.
- Screens go in `packages/quickstart/src/ui/screens/` (as slices), reusable components in `components/`.
- Shared modules (`hooks/`, `lib/`, `components/`) must never import from screen slices. If a type is needed by both, put it in `ui/lib/`.
- Framework integrations each get their own subdir under `packages/core/src/frameworks/`.
- All state mutations go through `WizardStore` setters so reactivity works.
- Enums for screen IDs, not string literals.
- Prefer `AbortController` for removing event listeners instead of manual `removeEventListener`.
- All commits must follow Conventional Commits. The `commit-msg` hook enforces this via commitlint.
- Run `pnpm qa` before pushing to ensure CI will pass.
- When writing or modifying code, always use the `wizard-architecture` skill first to load the project's architecture and coding conventions.
- When writing, modifying, or adding any test file (unit, integration, or e2e), always use the `wizard-testing` skill first to load the project's testing guidelines, conventions, and test framework structure.
- When making commits or working with the CI/release pipeline, use the `wizard-development-harness` skill for guidelines.

## Skills (Mandatory)

Before making any changes, agents MUST load the relevant skill(s) from `.claude/skills/`. These skills contain the authoritative guidelines for this project — architecture constraints, coding conventions, testing philosophy, and development harness rules. Skipping them leads to guideline violations.

| Skill                        | When to load                | Key rules                                                                                                                                                                                                          |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wizard-architecture`        | Any code change             | Cross-package imports, dependency direction, dry-run separation, initialization hooks, TypeScript style (`type` over `interface`, `satisfies never` in switch defaults, object params for 4+ args), module exports |
| `wizard-testing`             | Any test change or addition | Observable behavior only, AAA pattern, `sut` naming, `using` for disposables, `waitFor` over `delay`, MSW for HTTP mocks, `@spotify-confidence/testing` sub-path imports, `press('Enter')` for e2e keys            |
| `wizard-ink-tui`             | Any TUI/screen change       | Ink rendering model, `@inkjs/ui` over standalone packages, `Colors`/`Icons`/`HAlign`/`VAlign` from `styles.ts`, named functions in `useEffect`                                                                     |
| `wizard-integrations`        | IDE integration changes     | Strategy pattern, self-contained IDE subdirs, adding new IDEs, MCP/chat/plugin flows                                                                                                                               |
| `wizard-development-harness` | Commits, CI, releases       | Conventional Commits, `pnpm qa` before push, pre-commit hooks, release-please                                                                                                                                      |
| `wizard-workflows`           | Workflow changes            | Hash-pinned actions with version comments, minimal permissions, per-secret references                                                                                                                              |
