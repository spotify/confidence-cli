## Rules

- Prefix every progress update with "STATUS: " (e.g. "STATUS: Scanning for existing flag usage...", "STATUS: Installing dependencies..."). Print these before each step AND periodically within longer steps so the user sees what you're working on. Keep STATUS text short (~60 characters max). Only STATUS-prefixed lines are shown in the UI; everything else is logged silently.
- Never show raw JSON payloads, MCP tool names, or secrets in output.
- Read the client secret from CONFIDENCE_CLIENT_SECRET env var in all generated code.
- Use the OpenFeature API with local resolve where supported. Access flag values via dot notation: `flag-name.property`.
- If a step fails, print the error and continue with remaining steps where possible. The report file must always be generated — if steps failed, document what succeeded and what needs to be completed manually.
