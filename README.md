<p align="center">
  <img src="assets/logo.svg" alt="Confidence" width="120" />
</p>

<h1 align="center">Confidence Quickstart</h1>

<p align="center">
  Get up and running with <a href="https://confidence.spotify.com">Confidence</a> in minutes. One command sets up authentication, installs the right SDK, connects MCP servers, and onboards your AI assistant — so you can start managing feature flags and experiments without leaving your editor.
</p>

<p align="center">
  <a href="https://confidence.spotify.com/docs/introduction"><img alt="Docs" src="https://img.shields.io/badge/docs-confidence.spotify.com-6E56CF"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue"></a>
  <a href="./CHANGELOG.md"><img alt="npm version" src="https://img.shields.io/npm/v/@spotify-confidence/quickstart?color=informational"></a>
</p>

## Highlights

- **Zero-to-flags in one command** — run `npx @spotify-confidence/quickstart` and the interactive wizard handles the rest
- **Auto-detects your stack** — React, Next.js, Node, Python, Swift, Kotlin, Java, and Go; installs the matching Confidence SDK
- **Connects your AI assistant** — configures MCP servers and IDE plugins for Claude Code, Cursor, or Codex so your agent can manage flags inline
- **Guided onboarding** — generates project context files that teach your AI assistant how your Confidence setup works
- **Migrating from another platform?** Pair with [Confidence AI Plugins](https://github.com/spotify/confidence-ai-plugins) for one-command migrations from PostHog, Eppo, Statsig, or Optimizely

## Quick Start

```bash
npx @spotify-confidence/quickstart
```

Requires Node.js 24+.

## Confidence AI Plugins

Prefer to manage the integration yourself? [confidence-ai-plugins](https://github.com/spotify/confidence-ai-plugins) provides standalone plugins that give AI agents the ability to manage feature flags, work with documentation, run migrations, and more — without the guided wizard flow.

## Documentation

- [Confidence docs](https://confidence.spotify.com/docs/introduction)
- [SDK integration guides](https://confidence.spotify.com/docs/sdks)
- [Migration guides](https://confidence.spotify.com/docs/migrations/overview)
- [OpenFeature standard](https://openfeature.dev)

## Community & Support

Found a bug or have a feature request? [Open an issue](https://github.com/spotify/confidence-cli/issues).

---

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

During the **project onboarding** step, the wizard spawns your chosen AI agent (Claude Code, Cursor, or Codex) to integrate the Confidence SDK into your project. The spawned agent can read and write files within your project directory — this is required for it to install dependencies, create configuration files, and modify source code. You will be prompted to confirm before this step begins.

## Telemetry

The wizard collects anonymous usage data (e.g. which steps you complete) to help improve the experience. No personal or project data is collected.

To opt out:

```bash
npx @spotify-confidence/quickstart --no-telemetry
```

Or set the environment variable:

```bash
CONFIDENCE_TELEMETRY=false npx @spotify-confidence/quickstart
```

Telemetry is automatically disabled in CI environments and during development.

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

### Troubleshooting

#### E2E tests fail to install or build

E2E tests use `node-pty` to drive the TUI in a real terminal. This native module requires platform-specific build tools. If `pnpm install` fails on `node-pty`, install the prerequisites listed at https://github.com/microsoft/node-pty#dependencies.

#### E2E tests fail with `posix_spawnp failed`

The stable `node-pty` release (v1.1.0) doesn't ship prebuilt binaries for Node.js v26+. The project uses `node-pty@1.2.0-beta.14` which includes updated Node-API bindings for newer Node versions. If you hit this error on a newer Node version, ensure the beta is installed. On CI with Node 24, the stable release works fine.

## License

[Apache License 2.0](./LICENSE)
