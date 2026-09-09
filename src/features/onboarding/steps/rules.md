## Rules

- Prefix every progress update with "STATUS: " if it isn't prefixed already (e.g. "STATUS: Scanning for existing flag usage...", "STATUS: Installing dependencies..."). Print these before each step AND within longer steps so the user sees what you're working on because STATUS-prefixed lines are shown in the UI; everything else is logged silently.
- **Timing: print a STATUS line at least every 30–60 seconds.** If a sub-task takes more than a minute (reading files, calling MCP tools, writing code, running builds), print intermediate STATUS lines describing what you're currently doing — e.g. "STATUS: Reading layout.tsx...", "STATUS: Querying docs for SDK setup...", "STATUS: Writing flag evaluation code...". The user has no other way to know you're still working.
- Keep STATUS text short **(~60 characters max)**.
- Never show raw JSON payloads, MCP tool names, or secrets in output.
- Read the client secret from CONFIDENCE_CLIENT_SECRET env var in all generated code.
- Use the OpenFeature API with local resolve where supported. Access flag values via dot notation: `flag-name.property`.
- Only create or modify files inside the project directory. Never write to paths outside it (e.g. home directory dotfiles, global configs, `/tmp`).
- If a step fails, print the error and continue with remaining steps where possible. The report file must always be generated — if steps failed, document what succeeded and what needs to be completed manually.
