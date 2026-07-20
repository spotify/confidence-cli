# GitHub Actions Workflows

Guidelines for writing and modifying GitHub Actions workflows in this project. Follow these when creating or editing files under `.github/workflows/`.

All rules are drawn from the [zizmor audit framework](https://docs.zizmor.sh/audits/), which models supply-chain, injection, and privilege-escalation threats specific to GitHub Actions.

## Hash-Pinned Actions (`unpinned-uses`, `ref-confusion`)

All `uses:` references to external actions **must** be pinned to a full commit SHA, with a version comment.

```yaml
# Correct — hash-pinned with version comment:
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1

# Wrong — tag reference (mutable, can be force-pushed):
- uses: actions/checkout@v4
```

Mutable tags (`v4`, `v4.3.1`) can be force-pushed by the action owner — or by an attacker who compromises the repo. A SHA pin is immutable: even if the tag moves, your workflow runs the exact code you audited.

1. **Pin to the commit SHA of a tagged release** — not an arbitrary commit.
2. **Add a trailing `# vX.Y.Z` comment** matching the release tag.
3. **Pin to a specific patch version** (e.g. `v4.3.1`), not a major tag (`v4`).
4. **When updating**, change the SHA and comment together. A stale comment gives false confidence.

### Looking Up SHAs

```bash
# Lightweight tags — SHA is the commit directly:
gh api repos/OWNER/REPO/git/ref/tags/vX.Y.Z --jq '.object.sha'

# Annotated tags — dereference the tag object to get the commit:
gh api repos/OWNER/REPO/git/tags/TAG_SHA --jq '.object.sha'
```

## Template Injection (`template-injection`)

Never interpolate attacker-controllable values directly in `run:` blocks via `${{ }}`. Template expansions happen _before_ the shell runs — they are not syntax-aware.

```yaml
# Wrong — injectable via a crafted issue title:
- run: echo "Title: ${{ github.event.issue.title }}"

# Correct — pass through an env var, let the shell handle it:
- run: echo "Title: ${ISSUE_TITLE}"
  env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
```

Use `${VARNAME}` (shell expansion), **not** `${{ env.VARNAME }}` (template expansion) — the latter is still pre-processed and injectable.

Controllable contexts include: `github.event.issue.title`, `github.event.pull_request.title`, `github.event.pull_request.body`, `github.event.comment.body`, `github.head_ref`, and similar event-sourced fields.

## Credential Persistence (`artipacked`)

`actions/checkout` persists git credentials on disk by default. Later steps or artifact uploads can inadvertently leak them. Always disable unless the job needs to push.

```yaml
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
  with:
    persist-credentials: false
```

Only omit `persist-credentials: false` when the job genuinely needs to push commits or tags.

## Dangerous Triggers (`dangerous-triggers`)

`pull_request_target` and `workflow_run` execute in the target repository context with write permissions, even when triggered by forks. This enables code execution, environment manipulation, and secret exfiltration.

- **Prefer `pull_request`** over `pull_request_target`.
- **Prefer `workflow_call`** (reusable workflows) over `workflow_run`.
- **Never check out or run PR code** in a `pull_request_target` workflow.
- If `pull_request_target` is unavoidable, add a repository check:
  ```yaml
  if: github.repository == github.event.pull_request.head.repo.full_name
  ```

## Permissions (`excessive-permissions`)

Grant the minimum permissions each job needs. Prefer setting `permissions: {}` at the workflow level and granting per-job.

```yaml
# Ideal — locked down at workflow level, opened per-job:
permissions: {}

jobs:
  release:
    permissions:
      contents: write # create releases and tags
    # ...

  publish:
    permissions: {} # no GitHub API access needed
    # ...
```

When per-job granularity isn't practical, declare at the workflow level with comments explaining each scope:

```yaml
permissions:
  contents: write # create GitHub releases and push tags
  pull-requests: write # open and update release PRs
```

Never leave `permissions` undeclared — the default varies by repository/org settings and may be overly broad.

## Cache Poisoning (`cache-poisoning`)

Release and publish workflows must not restore cached build state. An attacker with a valid `GITHUB_TOKEN` can inject malicious payloads into caches; default cache restoration silently uses the poisoned entries.

- **Disable caching in release/publish jobs.** If using `actions/setup-node`, omit the `cache` input in jobs that publish artifacts.
- If caching is needed for performance, use `lookup-only: true` for read-only cache access in release contexts.

## Environment Variable Injection (`github-env`)

Avoid writing attacker-controllable values to `GITHUB_ENV` or `GITHUB_PATH`, especially in `pull_request_target` or `workflow_run` contexts. An attacker can set `LD_PRELOAD` or shadow executables via `PATH`.

- Use `GITHUB_OUTPUT` for inter-step state instead of `GITHUB_ENV` when possible.
- If `GITHUB_ENV` is needed, write only literal strings from trusted sources.

## Secrets

- **Never hardcode credentials** in workflow YAML — use GitHub encrypted secrets (`hardcoded-container-credentials`).
- **Reference secrets individually** (`${{ secrets.NPM_TOKEN }}`), not via `secrets: inherit` (`secrets-inherit`).
- **Scope secrets to environments** when possible — repository-level secrets bypass environment protection rules (`secrets-outside-env`).

## Bot Conditions (`bot-conditions`)

`github.actor` is spoofable — it reflects the last actor on the triggering context, not necessarily the originator. Use `github.event.pull_request.user.login` instead.

```yaml
# Wrong — spoofable:
if: github.actor == 'dependabot[bot]'

# Correct — checks PR creator:
if: github.event.pull_request.user.login == 'dependabot[bot]'
```

## Container Images (`unpinned-images`)

Pin container images to SHA256 digests, not tags. Tags (including `:latest`) are mutable.

```yaml
# Wrong:
container:
  image: node:20

# Correct:
container:
  image: node@sha256:01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b
```

Retrieve digests via: `docker inspect node:20 --format='{{.RepoDigests}}'`

## Other Rules

- **`known-vulnerable-actions`** — Don't use actions with known CVEs. Check GitHub Advisories.
- **`archived-uses`** — Don't use actions from archived repositories. Replace with maintained alternatives.
- **`typosquat-uses`** — Double-check action owner/repo spelling to avoid typosquatting.
- **`insecure-commands`** — Never re-enable legacy `::set-env` or `::add-path` workflow commands.
- **`obfuscation`** — Avoid redundant expressions like `fromJSON(toJSON(...))` or literal-only `format()` calls.

## Existing Workflows

| File                            | Purpose                         |
| ------------------------------- | ------------------------------- |
| `.github/workflows/ci.yml`      | PR quality gate (QA checks)     |
| `.github/workflows/release.yml` | Release-please + npm publishing |
