---
name: development-harness
description: Quality gates, commit conventions, pre-commit hooks, and CI/CD processes for the Confidence CLI monorepo
version: '0.3'
---

# Development Harness

Quality gates, commit conventions, and CI/CD for the monorepo.

## Quality Harness

Run `pnpm qa` before committing and pushing — it runs typecheck + lint + test. Use `pnpm lint:fix` to auto-fix formatting.

Pre-commit hooks (Husky + lint-staged) auto-format staged files on every commit.

## Commit Conventions

All commits follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by a `commit-msg` hook via commitlint.

```
<type>(<optional scope>): <description>
```

Types: `feat` (minor bump), `fix` (patch bump), `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`. Append `!` for breaking changes (major bump).

```
feat(cli): add whoami command
fix(frameworks): correct Next.js detection for app router
refactor(core): extract shared types to lib module
```

## CI/CD

**PR checks** (`.github/workflows/ci.yml`): typecheck + lint + test + commit message validation. Both must pass before merging.

**Release** (`.github/workflows/release.yml`): release-please opens a PR on `main` with changelog + version bumps. Merging the Release PR triggers GitHub Release + npm publish. No manual version bumping — versions are derived from commit messages.

Required secrets: `GITHUB_TOKEN` (automatic), `NPM_TOKEN` (repository secret).
