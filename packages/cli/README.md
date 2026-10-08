<p align="center">
  <img src="../../assets/logo.svg" alt="Confidence" width="120" />
</p>

<h1 align="center">Confidence CLI</h1>

<p align="center">
  Manage <a href="https://confidence.spotify.com">Confidence</a> feature flags, events, session recordings, and MCP integrations from the command line.
</p>

<p align="center">
  <a href="https://confidence.spotify.com/docs/introduction"><img alt="Docs" src="https://img.shields.io/badge/docs-confidence.spotify.com-6E56CF"></a>
  <a href="../../LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue"></a>
  <a href="./CHANGELOG.md"><img alt="npm version" src="https://img.shields.io/npm/v/@spotify-confidence/cli?color=informational"></a>
</p>

## Install

```bash
npm install -g @spotify-confidence/cli
```

Requires Node.js 24+.

## Quick Start

```bash
confidence login           # Sign in via browser OAuth
confidence flags setup     # Set up feature flags in your project
confidence events list     # List all event definitions
confidence quickstart      # Launch the interactive setup wizard
```

## Commands

### Authentication

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `confidence login`  | Sign in to Confidence via browser OAuth          |
| `confidence logout` | Clear stored credentials                         |
| `confidence whoami` | Show current user, org, region, and token expiry |

### Feature Flags

| Command                  | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `confidence flags setup` | Set up feature flags in your project via guided wizard |

### Events

| Command                                | Description                             |
| -------------------------------------- | --------------------------------------- |
| `confidence events list`               | List all event definitions              |
| `confidence events create --name <id>` | Create a new event definition           |
| `confidence events update <name>`      | Update an event definition's schema     |
| `confidence events delete <name>`      | Delete an event definition              |
| `confidence events usage <name>`       | Show recent event usage statistics      |
| `confidence events setup`              | Set up event tracking via guided wizard |

### Session Recordings

| Command                                             | Description                         |
| --------------------------------------------------- | ----------------------------------- |
| `confidence recordings setup`                       | Set up recordings via guided wizard |
| `confidence recordings policy list`                 | List recording policies             |
| `confidence recordings policy create`               | Create a new recording policy       |
| `confidence recordings policy get <policy>`         | Show policy details with rules      |
| `confidence recordings rule add`                    | Add a sampling rule to a policy     |
| `confidence recordings rule enable <rule>`          | Enable a recording rule             |
| `confidence recordings rule disable <rule>`         | Disable a recording rule            |
| `confidence recordings targeting-key show <client>` | Show available targeting keys       |
| `confidence recordings targeting-key add`           | Add a targeting key to a client     |

### Data Warehouses

| Command                                              | Description                                        |
| ---------------------------------------------------- | -------------------------------------------------- |
| `confidence warehouse validate`                      | Validate warehouse configuration                   |
| `confidence warehouse create`                        | Create a data warehouse connection                 |
| `confidence warehouse connector create-flag-applied` | Create flag assignment data connector              |
| `confidence warehouse connector create-event`        | Create event data connector                        |
| `confidence warehouse assignment-table create`       | Create an assignment table for experiment analysis |
| `confidence warehouse crypto-key create`             | Create a crypto key (Snowflake)                    |

### MCP Servers

| Command                    | Description                                  |
| -------------------------- | -------------------------------------------- |
| `confidence mcp install`   | Install MCP servers for your AI coding agent |
| `confidence mcp uninstall` | Remove MCP server configuration              |
| `confidence mcp status`    | Check MCP server connection status           |
| `confidence mcp list`      | List available MCP servers                   |
| `confidence mcp auth`      | Refresh MCP server credentials               |

### Configuration

| Command                             | Description                     |
| ----------------------------------- | ------------------------------- |
| `confidence config set <key> <val>` | Set a configuration value       |
| `confidence config get <key>`       | Get a configuration value       |
| `confidence config list`            | List all configuration values   |
| `confidence config reset`           | Reset configuration to defaults |

### Other

| Command                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `confidence quickstart` | Launch the interactive Confidence setup wizard |
| `confidence update`     | Update the CLI to the latest version           |
| `confidence --help`     | Show help with examples                        |
| `confidence --version`  | Show CLI version                               |

## Global Options

| Option      | Description                                |
| ----------- | ------------------------------------------ |
| `--json`    | Force JSON output                          |
| `--output`  | Output format: `json`, `table`, or `plain` |
| `--profile` | Use a named auth profile                   |
| `--help`    | Show help                                  |
| `--version` | Show version number                        |

## Output Formats

The CLI auto-detects the best output format: tables in interactive terminals, JSON when piped. Override with `--json` or `--output`:

```bash
confidence events list --json              # Force JSON
confidence whoami --output plain           # Force plain text
confidence events list | jq '.data[].name' # Pipe-friendly JSON
```

## License

[Apache License 2.0](../../LICENSE)
