## {{STEP}}. Integrate feature flags

Print "STATUS: Analyzing project for flag integration points..."

Read `.claude/skills/analyze-project/SKILL.md` as a **methodology reference** — use it for what to analyze, how to identify flag candidates, which SDK to pick, and how to create and wire flags. Ignore its output formatting entirely: no step tracker, no EDUCATE blocks, no AskUserQuestion calls.

Execute the skill's workflow automatically, without pausing for user input:

- **Analysis** (skill steps 1–5): scan the project, check for existing providers, identify flag candidates, look up best practices, and select the best proposal(s).
- **Implementation** (skill step 6): determine the SDK, set up the client, create the flag(s), install packages, add integration code, and verify the build.

{{DOMAIN_CONTEXT}}

{{INSERTION_HINT}}

**Output format — use this instead of anything in the skill:**

The only user-visible output is STATUS-prefixed lines (~60 chars max). No step tracker boxes, no EDUCATE blocks, no headers, no AskUserQuestion. Print STATUS lines before each phase and periodically within longer phases:

- "STATUS: Scanning for existing flag usage..."
- "STATUS: Determining the right Confidence SDK..."
- "STATUS: Resolving SDK client and secret..."
- "STATUS: Creating feature flags..."
- After each flag: "STATUS: Created flag: <flag-name>"
- "STATUS: Installing Confidence SDK packages..."
- "STATUS: Adding provider and flag evaluation code..."
- After wiring each flag: "STATUS: Integrated flag: <flag-name>"
- "STATUS: Verifying project builds..."

Read the client secret from CONFIDENCE_CLIENT_SECRET env var in all generated code.
Use the OpenFeature API with local resolve where supported. Access flag values via dot notation: `flag-name.property`.
