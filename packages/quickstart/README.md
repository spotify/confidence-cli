<p align="center">
  <img src="../../assets/logo.svg" alt="Confidence" width="120" />
</p>

<h1 align="center">Confidence Quickstart</h1>

<p align="center">
  Get up and running with <a href="https://confidence.spotify.com">Confidence</a> in minutes. One command sets up authentication, installs the right SDK, connects MCP servers, and onboards your AI assistant — so you can start managing feature flags and experiments without leaving your editor.
</p>

<p align="center">
  <a href="https://confidence.spotify.com/docs/introduction"><img alt="Docs" src="https://img.shields.io/badge/docs-confidence.spotify.com-6E56CF"></a>
  <a href="../../LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue"></a>
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

During the **project onboarding** step, the wizard spawns your chosen AI agent to integrate the Confidence SDK into your project. You will be prompted to confirm before this step begins. Each agent runs with different permissions:

- **Claude Code** — Spawned in non-interactive (`--print`) mode using its standard permission model. It can read files and execute tools within your project directory as allowed by your existing Claude Code settings. No elevated trust flags are applied.
- **Cursor** — Spawned in agent mode with `--trust`, which grants full read/write access to files in your project directory and allows it to run shell commands (e.g. `npm install`) without individual approval prompts. MCP server connections are also auto-approved (`--approve-mcps`).
- **Codex** — Spawned in `exec` mode with `--sandbox danger-full-access`, which grants unrestricted filesystem and network access. It can read and write any file, run shell commands, and make network requests without sandboxing restrictions. Full access is required because the onboarding agent needs to install npm packages, modify project configuration files, and download SDK dependencies — operations that Codex's default sandbox would block.

All agents are scoped to your project directory and run with a timeout. The wizard installs a Confidence skill/plugin and connects MCP servers _before_ spawning the agent, so configuration files may already be written to your project at that point.

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

## License

[Apache License 2.0](../../LICENSE)
