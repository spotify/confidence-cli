## {{STEP}}. Instrument Event Tracking

Print "STATUS: Analyzing project for event tracking..."

The detected framework is **{{FRAMEWORK}}**.

Read `{{SKILLS_DIR}}/instrument-events/SKILL.md` as a **methodology reference** — use it for what to scan, how to identify trackable events, how to create event definitions with entity references, and how to add `track()` calls. Ignore its output formatting entirely: no step tracker, no EDUCATE blocks, no AskUserQuestion calls.

Execute the skill's workflow automatically, without pausing for user input:

- **Discovery** (skill steps 1–2): scan the project, detect existing instrumentation, cross-reference with registered event definitions.
- **Proposal** (skill step 3): identify the top 3–5 most valuable events paired with metrics. Pick automatically based on domain analysis — do not ask the user.
- **Implementation** (skill steps 4–6): create event definitions with entity references, add SDK `track()` calls, verify the pipeline.

{{DOMAIN_CONTEXT}}

**Example STATUS lines for this step:**

- "STATUS: Scanning for existing event tracking..."
- "STATUS: Checking registered event definitions..."
- "STATUS: Identifying trackable events..."
- "STATUS: Selected <N> events to instrument"
- "STATUS: Creating event definitions..."
- "STATUS: Created event: <event-name>"
- "STATUS: Adding track() calls..."
- "STATUS: Modified <file> with track() call"
- "STATUS: Verifying event pipeline..."

**Event-tracking guardrails:**

- Every event definition MUST have at least one string field with `semanticType.entityReference` pointing to an entity (e.g. `entities/visitor`). Without this, no fact table is auto-created and the metric pipeline is broken. Call `mcp__confidence-flags__listEntities` to find available entities.
- Never create duplicate event definitions — cross-reference existing definitions first.
- Use the Confidence vanilla SDK `confidence.track()` for event tracking — not the OpenFeature `client.track()`. Adapt to the app's existing analytics layer if one is present.
- If the warehouse is not configured, note this in the status output. Event definitions and code can still be created — data will flow once a warehouse is connected.
- Event definition IDs: 4–63 chars, lowercase letters, digits, and hyphens only.
- Schema field names: use snake_case for multi-word fields.
