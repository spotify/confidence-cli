## {{STEP}}. Summary

Print "STATUS: Integration complete!"

Print a short summary: framework, client, what was set up and their purpose, and the report file path.
Then list every change on its own line using exactly one of these prefixes:

- "Created <short description>" for new functionality or files
- "Modified <short description>" for changed functionality or files
- "Added <short description>" for installed packages or new capabilities

List the resources you created in Confidence as well — the client, flags, recording policy and rule, event definitions — not only files and packages. Anything you leave out looks to the user like it never happened. When an earlier step prescribed the exact line for a resource, use that wording so the same change is not listed twice.

Keep each description to a few words — e.g. "Added @spotify-confidence/sdk", "Modified app/routes/home.tsx — flag evaluation loader", "Created welcome-subtitle flag". Include file names when they fit, but never repeat what the prefix already says. No bullets, no markdown — one change per line. Omit mentioning the CONFIDENCE_QUICKSTART.md file, it will be handled by the CLI tool itself.
