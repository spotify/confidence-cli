## {{STEP}}. Summary

Print "STATUS: Integration complete!"

Print a short summary: framework, client, what was set up and their purpose, and the report file path.
Then list every change on its own line using exactly one of these prefixes:

- "Created <short description>" for new functionality or files
- "Modified <short description>" for changed functionality or files
- "Added <short description>" for installed packages or new capabilities

Keep each description to a few words — e.g. "Added @spotify-confidence/sdk", "Modified app/routes/home.tsx — flag evaluation loader", "Created welcome-subtitle flag". Include file names when they fit, but never repeat what the prefix already says. No bullets, no markdown — one change per line. Omit mentioning the CONFIDENCE_QUICKSTART.md file, it will be handled by the CLI tool itself.
