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

| Command                               | Description                                            |
| ------------------------------------- | ------------------------------------------------------ |
| `confidence flags setup`              | Set up feature flags in your project via guided wizard |
| `confidence flags list`               | List all flags in project                              |
| `confidence flags get <flag-key>`     | Get flag details (variants, targeting, status)         |
| `confidence flags create <flag-key>`  | Create a new flag                                      |
| `confidence flags update <flag-key>`  | Update flag description or variants                    |
| `confidence flags toggle <flag-key>`  | Enable or disable a flag for a client                  |
| `confidence flags resolve <flag-key>` | Resolve flag value for given context                   |
| `confidence flags target <flag-key>`  | View or update targeting rules                         |
| `confidence flags archive <flag-key>` | Archive a flag                                         |

### Events

| Command                                | Description                             |
| -------------------------------------- | --------------------------------------- |
| `confidence events setup`              | Set up event tracking via guided wizard |
| `confidence events list`               | List all event definitions              |
| `confidence events create --name <id>` | Create a new event definition           |
| `confidence events update <name>`      | Update an event definition's schema     |
| `confidence events delete <name>`      | Delete an event definition              |
| `confidence events usage <name>`       | Show recent event usage statistics      |

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

### Fact Tables

| Command                                                           | Description                                     |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| `confidence data fact-tables list`                                | List one page of fact tables                    |
| `confidence data fact-tables get factTables/<id>`                 | Get the complete resource and lifecycle state   |
| `confidence data fact-tables create --from-file fact.json [--id]` | Create one fact table from a resource JSON file |

List supports `--page-size`, `--page-token`, `--filter` (Lucene query string),
`--show-deleted`, and `--order-by` (for example `displayName:desc,createTime:asc`).
Pagination is opt-in: `--all --max-pages 10 --max-items 1000` traverses only within
those explicit bounds (maximum 1000 pages / 100000 resources). If a bound is reached,
`nextPageToken` is retained; use it to continue. Repeated tokens fail instead of looping.

Create reads the **resource itself**, with camelCase proto-JSON keys, not a
`factTable` wrapper or CLI-option keys:

```json
{
  "displayName": "Purchases",
  "sql": "SELECT purchased_at, user_id, amount, country FROM purchases",
  "timestampColumn": { "name": "purchased_at" },
  "entities": [{ "column": { "name": "user_id" }, "entity": "entities/user" }],
  "measures": [{ "column": { "name": "amount" }, "unit": { "currencyCode": "USD" } }],
  "dimensions": [{ "name": "country" }]
}
```

`sql`, `displayName`, `timestampColumn.name`, and at least one entity mapping are
required. Optional fields include `description`, `measures` (`column`, `displayName`,
`unit`, `declaredType`), `dimensions`, `labels` (string values), `owner`
(`identities/<id>`), `factDataDeliveredUntilTime` (RFC 3339 timestamp), and
`dataDeliveredUntilUpdateStrategyConfig` (`strategy: MANUAL|AUTOMATIC`, optional
`disableEmptyPartitions`, and at most one `automaticUpdateConfig`, `dailyUpdateConfig`,
or `hourlyUpdateConfig`). Automatic config requires `commitDelay`; it also supports
`incrementDuration` and `changeThreshold: { "value": "0.01" }`. Daily/hourly config
supports `maxZeroDuration`. Durations use protobuf strings such as `3600s`. Enums use
their symbolic proto names. Columns accept only `name` and optional boolean `repeated`.
Unknown fields, output-only lifecycle fields, and column annotations are rejected,
not silently dropped. `skipSqlPreview` and `column.type` are **not supported** by
this command: omit both and let the service validate SQL and infer column types.
Use `--id purchases` to select an ID; omit it for a server-generated ID. IDs must
start with an ASCII letter or digit and contain only letters, digits, `_`, or `-`.
Do not set `name` in create input.

These commands support `--profile`, `--json` / `--output`, and `--dry-run`.
Dry-run validates input and previews the request without authentication or HTTP.
The selected profile's token determines the Metrics API region. JSON output keeps
the complete remote resource, including state, errors, and job references. A
successful GET of a resource in `TABLE_STATE_FAILED` still exits successfully;
inspect its `state` and `error` to diagnose warehouse validation.

Create is an explicit, single write, not an approval workflow. It does not retry or
poll for activation. On a transport/5xx/unreadable-response failure (including a
malformed successful response), the write outcome may be unknown: inspect list/get
before deciding whether to retry. When `--id` is set, the error includes the qualified
resource name to look up. Responses must contain resource objects with qualified
`factTables/<id>` names; malformed get/list responses are errors, not successful output.

### SDK

| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `confidence sdk install` | Detect framework and install the Confidence SDK |
| `confidence sdk setup`   | Set up the Confidence SDK in your project       |

### Documentation

| Command                          | Description                      |
| -------------------------------- | -------------------------------- |
| `confidence docs search <query>` | Search Confidence documentation  |
| `confidence docs grep <pattern>` | Grep through documentation       |
| `confidence docs read <page>`    | Read a docs page in the terminal |

### AI Plugin

| Command                       | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| `confidence plugin install`   | Install the Confidence AI plugin for your coding agent |
| `confidence plugin update`    | Update the Confidence AI plugin to the latest version  |
| `confidence plugin uninstall` | Remove the Confidence AI plugin from your coding agent |

### Migration

| Command                         | Description                                         |
| ------------------------------- | --------------------------------------------------- |
| `confidence migrate detect`     | Scan project for third-party feature flag providers |
| `confidence migrate statsig`    | Migrate from Statsig to Confidence                  |
| `confidence migrate eppo`       | Migrate from Eppo to Confidence                     |
| `confidence migrate posthog`    | Migrate from PostHog to Confidence                  |
| `confidence migrate optimizely` | Migrate from Optimizely to Confidence               |

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

## Shared Command Options

These options are available on `migrate`, `mcp`, `plugin`, `sdk`, and `warehouse` commands:

| Option  | Description                                  |
| ------- | -------------------------------------------- |
| `--dir` | Target project directory                     |
| `--ide` | AI coding agent: `claude`, `cursor`, `codex` |

## Output Formats

The CLI auto-detects the best output format: tables in interactive terminals, JSON when piped. Override with `--json` or `--output`:

```bash
confidence events list --json              # Force JSON
confidence whoami --output plain           # Force plain text
confidence events list | jq '.data[].name' # Pipe-friendly JSON
```

## License

[Apache License 2.0](../../LICENSE)
