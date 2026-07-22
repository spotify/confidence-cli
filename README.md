# Confidence Quickstart

Interactive CLI wizard for setting up and integrating [Confidence](https://confidence.spotify.com/) with your project. It walks you through authentication, framework detection, SDK installation, MCP server connection, and project onboarding — all from the terminal.

## Quick Start

```bash
npx @spotify/confidence-quickstart
```

Requires Node.js 24+.

## What It Does

The wizard guides you through:

1. **System check** — verifies your environment and IDE (Claude Code, Cursor, or Codex)
2. **Authentication** — connects to your Confidence account
3. **Framework detection** — identifies your project's framework (React, Next.js, Node, Python, Swift, Kotlin, Java, Go)
4. **SDK installation** — installs the appropriate Confidence SDK
5. **MCP & plugin setup** — connects Confidence MCP servers and IDE plugins
6. **Project onboarding** — generates context files to help your AI assistant understand your Confidence setup

## Usage

```
confidence-quickstart [command] [options]
```

### Commands

| Command     | Description                         |
| ----------- | ----------------------------------- |
| _(default)_ | Launch the interactive setup wizard |
| `start`     | Alias for the default command       |
| `help`      | Show the help message               |

### Options

| Option           | Description                                       |
| ---------------- | ------------------------------------------------- |
| `--dir <path>`   | Project directory to run the wizard in            |
| `--dry-run`      | Run without making real API calls                 |
| `--debug`        | Enable debug output and preserve terminal history |
| `--no-telemetry` | Disable anonymous usage telemetry                 |

## Security Note

During the **project onboarding** step, the wizard spawns your chosen AI agent (Claude Code, Cursor, or Codex) to integrate the Confidence SDK into your project. The spawned agent runs with **full filesystem access** — this is required for it to install dependencies, create configuration files, and modify source code. You will be prompted to confirm before this step begins.

## Development

```bash
pnpm install
pnpm try          # Run the wizard locally via tsx
pnpm test         # Run vitest
pnpm lint         # ESLint + Prettier check
pnpm typecheck    # TypeScript type checking
pnpm qa           # Run all checks (typecheck + lint + test)
pnpm build        # Build for distribution
```

## Troubleshooting

### E2E tests fail to install or build

E2E tests use `node-pty` to drive the TUI in a real terminal. This native module requires platform-specific build tools. If `pnpm install` fails on `node-pty`, install the prerequisites listed at https://github.com/microsoft/node-pty#dependencies.

### E2E tests fail with `posix_spawnp failed`

The stable `node-pty` release (v1.1.0) doesn't ship prebuilt binaries for Node.js v26+. The project uses `node-pty@1.2.0-beta.14` which includes updated Node-API bindings for newer Node versions. If you hit this error on a newer Node version, ensure the beta is installed. On CI with Node 24, the stable release works fine.

## Telemetry

The wizard collects anonymous usage data (e.g. which steps you complete) to help improve the experience. No personal or project data is collected.

To opt out:

```bash
npx @spotify/confidence-quickstart --no-telemetry
```

Or set the environment variable:

```bash
CONFIDENCE_TELEMETRY=false npx @spotify/confidence-quickstart
```

Telemetry is automatically disabled in CI environments and during development.
