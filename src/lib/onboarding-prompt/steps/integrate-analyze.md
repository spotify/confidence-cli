### {{STEP}}a. Analyze project and find insertion points

Print "STATUS: Analyzing project for flag integration points..."

{{DOMAIN_CONTEXT}}

**Detect the source root** — check for `src`, `app`, `lib`, `pages`, `server` and use the first match (or `.`). Exclude `node_modules`, `.venv`, `vendor`, `target`, `build`, `dist`, `.next`, `__pycache__` from scans.

**Check for existing flag usage** — scan for other providers (LaunchDarkly, Unleash, PostHog, Statsig, Optimizely, GrowthBook, Flagsmith, Flipt). If found, the integration should replace one call site, not rip out the old system.

**Identify good flag candidates** — match each to a use case:

- **Gradual rollout**: new behavior being shipped (redesigned section, new onboarding step, migrated API). Ramp exposure 1% → 100%, roll back instantly if metrics drop.
- **A/B experiment**: two alternatives where data should decide (CTA label, pricing layout, algorithm). Splits traffic to measure which performs better.
- **Kill switch**: critical path that must be disableable without a deploy (third-party integration, heavy computation, new payment flow).
- **Entitlement gate**: capability gated by user tier, region, or plan (premium features, beta access). Targeting rules control who sees what.

**Don't flag**: one-time migrations, build config, database schemas, deploy-time code, or logic with no user-observable effect.

**Find "aha" insertion points** — places where toggling a flag produces an immediately visible change:

1. UI text (title, heading, welcome message, label)
2. UI component toggle (banner, sidebar, CTA — show/hide)
3. API response field that changes based on the flag
4. Log/console output (last resort for CLIs or libraries)

{{INSERTION_HINT}}

Print "STATUS: Looking up Confidence best practices..."

Then look up Confidence best practices:

- If docs MCP tools are available: call `{{DOCS_searchDocumentation}}` with query "feature flags use cases best practices".
- Otherwise: search the web for best practices at {{DOCS_URL}}.

Based on the {{CODE_CONTEXT}}, the insertion points, and the docs, propose 1–3 feature flags. For each:

- **Use case**: rollout, experiment, kill switch, or entitlement. For rollout/kill-switch flags, note they should be archived once stable.
- **Name**: short, descriptive (`new-checkout`, not `new-checkout-enabled-mobile`).
- **Schema**: typed properties in a JSON object (`boolSchema`, `stringSchema`, `intSchema`, `doubleSchema`). One flag can control multiple aspects — e.g. `{ "enabled": { "boolSchema": {} }, "heading": { "stringSchema": {} } }`. Properties are accessed via dot notation (`flag-name.property`), so choose clear property names.
- **Variants**: named JSON objects with values for every schema property. Match naming to use case: "control"/"treatment" for experiments, "current"/"redesign" for rollouts, "on"/"off" for kill switches. Default variant must produce current behavior.
- One sentence: why this flag is useful and where it goes.

Print "STATUS: Proposing feature flags..."

Print each proposed flag with its rationale.
