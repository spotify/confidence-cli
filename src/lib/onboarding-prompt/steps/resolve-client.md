## {{STEP}}. Resolve SDK client

Print "STATUS: Resolving SDK client and secret..."

If flag management tools are available (from preflight):

- Call `{{FLAGS_listClients}}`.
  - If one client exists, use it.
  - If multiple exist, pick the first one.
  - If none exist, call `{{FLAGS_createClient}}` with name "{{FRAMEWORK}} App", then use the new client.
- Call `{{FLAGS_getClientSecret}}` with the client name.
- Write the secret to the project's .env file as CONFIDENCE_CLIENT_SECRET=<secret> (create the file if it doesn't exist, append if it does).

If flag management tools are NOT available:

- Create or update the .env file with CONFIDENCE_CLIENT_SECRET=<your-client-secret-here> as a placeholder.
- Print: "Create a client at https://app.confidence.spotify.com and paste its secret into .env"

If a .gitignore exists and doesn't already list .env, add it.
Generated code must read the secret from the CONFIDENCE_CLIENT_SECRET environment variable, never hardcoded.
