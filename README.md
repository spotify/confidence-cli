<p align="center">
  <img src="assets/logo.svg" alt="Confidence" width="120" />
</p>

<h1 align="center">Confidence CLI</h1>

<p align="center">
  CLI tools for setting up and managing <a href="https://confidence.spotify.com">Confidence</a> feature flags, experiments, and integrations.
</p>

<p align="center">
  <a href="https://confidence.spotify.com/docs/introduction"><img alt="Docs" src="https://img.shields.io/badge/docs-confidence.spotify.com-6E56CF"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue"></a>
</p>

## Packages

This monorepo contains two published packages:

| Package | Description | |
| ------- | ----------- | --- |
| [`@spotify-confidence/cli`](./packages/cli/) | CLI for managing Confidence — flags, events, recordings, config, MCP | [![npm](https://img.shields.io/npm/v/@spotify-confidence/cli?color=informational)](https://www.npmjs.com/package/@spotify-confidence/cli) |
| [`@spotify-confidence/quickstart`](./packages/quickstart/) | Interactive TUI wizard for first-time project setup | [![npm](https://img.shields.io/npm/v/@spotify-confidence/quickstart?color=informational)](https://www.npmjs.com/package/@spotify-confidence/quickstart) |

## Get Started

**Set up a new project** with the interactive wizard:

```bash
npx @spotify-confidence/quickstart
```

**Or install the CLI** for ongoing management:

```bash
npm install -g @spotify-confidence/cli
confidence login
confidence flags setup
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

## Development

On Windows, clone with symlinks enabled so `CLAUDE.md` is not checked out as a copy (which breaks Prettier):

```bash
git clone -c core.symlinks=true https://github.com/spotify/confidence-cli.git
```

If the repo is already cloned, run `git checkout -- CLAUDE.md` after `git config core.symlinks true`.

```bash
pnpm install                                          # Install all workspace deps
pnpm --filter @spotify-confidence/quickstart try      # Run the wizard locally via tsx
pnpm --filter @spotify-confidence/cli try             # Run the CLI locally via tsx
pnpm test                                             # Run all tests
pnpm lint                                             # ESLint + Prettier check
pnpm typecheck                                        # TypeScript type checking
pnpm qa                                               # Run all checks (typecheck + lint + test)
pnpm build                                            # Build all packages
```

### Troubleshooting

#### E2E tests fail to install or build

E2E tests use `node-pty` to drive the TUI in a real terminal. This native module requires platform-specific build tools. If `pnpm install` fails on `node-pty`, install the prerequisites listed at https://github.com/microsoft/node-pty#dependencies.

#### E2E tests fail with `posix_spawnp failed`

The stable `node-pty` release (v1.1.0) doesn't ship prebuilt binaries for Node.js v26+. The project uses `node-pty@1.2.0-beta.14` which includes updated Node-API bindings for newer Node versions. If you hit this error on a newer Node version, ensure the beta is installed. On CI with Node 24, the stable release works fine.

## License

[Apache License 2.0](./LICENSE)
