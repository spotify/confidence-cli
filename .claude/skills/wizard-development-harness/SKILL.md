# Development Harness

This skill defines the quality gates, commit conventions, and CI/CD processes for the Confidence Wizard CLI. Follow these when making changes, creating commits, or setting up automation.

## Quality Harness

All quality checks are available as individual scripts and as a combined `qa` script.

### Scripts

| Script           | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `pnpm typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `pnpm lint`      | ESLint + Prettier check                   |
| `pnpm lint:fix`  | ESLint auto-fix + Prettier write          |
| `pnpm test`      | Run vitest test suite                     |
| `pnpm qa`        | Run all checks: typecheck, lint, test     |

### When to Run

- **Before committing**: `pnpm qa` runs the full suite. Pre-commit hooks handle formatting automatically, but run `qa` to catch type errors and test failures early.
- **Before pushing**: Always run `pnpm qa` to ensure CI will pass.
- **After refactoring**: Run `pnpm qa` to verify nothing broke.

## Pre-Commit Hooks

Husky runs lint-staged on every commit:

- **TypeScript/JavaScript files** (`*.{ts,tsx,js,jsx}`): ESLint auto-fix + Prettier format
- **Other files** (`*.{json,css,md}`): Prettier format

This means staged files are always formatted and lint-clean before they enter the commit.

## Commit Conventions

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/). A `commit-msg` hook enforces this via commitlint.

### Format

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | When to Use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature (triggers minor version bump)               |
| `fix`      | Bug fix (triggers patch version bump)                   |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, whitespace (not CSS)                        |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or updating tests                                |
| `build`    | Build system or external dependency changes             |
| `ci`       | CI configuration changes                                |
| `chore`    | Maintenance tasks                                       |

### Breaking Changes

Append `!` after the type/scope or include `BREAKING CHANGE:` in the footer. This triggers a major version bump.

```
feat!: remove legacy auth flow
```

### Examples

```
feat(ui): add framework selection screen
fix(frameworks): correct Next.js detection for app router
refactor: extract shared types to lib module
chore(deps): update ink to v6.9
test: add coverage for wizard store reactivity
```

## CI/CD

### Pull Request Checks (`.github/workflows/ci.yml`)

Every PR against `main` runs two jobs:

1. **Quality checks**: typecheck, lint, test
2. **Commit messages**: validates all PR commits follow conventional commits

Both must pass before merging.

### Release Automation (`.github/workflows/release.yml`)

On push to `main`, release-please runs a two-step PR-based workflow:

1. **Release PR**: release-please opens (or updates) a PR that accumulates changelog entries and version bumps from conventional commits
2. **Publish**: when the Release PR is merged, release-please creates a GitHub Release + git tag, and a separate `publish` job runs tests, builds, and publishes to npm

**No manual version bumping.** The version is derived entirely from commit messages. Write meaningful conventional commits — release-please handles the rest. The Release PR gives the team a review window before each release ships.

### Required Secrets

- `GITHUB_TOKEN` — provided automatically by GitHub Actions
- `NPM_TOKEN` — must be configured in repository secrets for npm publishing

## Configuration Files

| File                            | Purpose                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| `.commitlintrc.json`            | Commitlint config (extends `@commitlint/config-conventional`)             |
| `release-please-config.json`    | Release-please config (release type, packages)                            |
| `.release-please-manifest.json` | Release-please version manifest (tracks current version)                  |
| `.lintstagedrc.json`            | Lint-staged config (eslint + prettier for code, prettier for other files) |
| `.husky/pre-commit`             | Runs lint-staged                                                          |
| `.husky/commit-msg`             | Runs commitlint                                                           |
| `.github/workflows/ci.yml`      | PR quality gate                                                           |
| `.github/workflows/release.yml` | Automated release on main                                                 |
