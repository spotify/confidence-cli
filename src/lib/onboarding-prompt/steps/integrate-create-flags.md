### {{STEP}}b. Create flags

Print "STATUS: Creating feature flags..."

If flag management tools are available (from preflight):

- Call `{{FLAGS_listFlags}}`. Reuse relevant flags if they exist.
- For each new flag:
  1. Call `{{FLAGS_createFlag}}` with the name, client, schema, and variants.
  2. Call `{{FLAGS_addTargetingRule}}` — default 100% to the safe/control variant. The rule hashes `targeting_key` for consistent assignment.
- Verify each flag by calling `{{FLAGS_resolveFlag}}` with a test context (`{ "targeting_key": "test-user" }`). If it fails, check the flag has a client and a targeting rule with allocation > 0.
- After each flag is created, print: STATUS: Created flag: <flag-name>

If flag management tools are NOT available:

- Print the flag definitions (name, variants, schema) so the user can create them at https://app.confidence.spotify.com.
- Continue using the proposed flag names in the integration code.
