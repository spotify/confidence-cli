### {{STEP}}d. Add integration code

Print "STATUS: Adding provider and flag evaluation code..."

Using the SDK guide, add the following to the project:

1. Provider initialization at the app's entry point (reading the secret from env).{{REACT_GOTCHAS}}
2. Set up the evaluation context — key-value data for targeting and randomization:
   - `targeting_key` (required): stable user identifier (user ID, session ID, or anonymous ID). Confidence hashes this for consistent variant assignment.
   - Include attributes the app already has (`country`, `plan`, `device`) for targeting rules. Don't fabricate attributes.
   - Client SDKs auto-generate a `visitor_id` per browser/install; pass it to the server SDK if using both.
3. For each created flag, evaluate and use the result at the insertion points from step {{STEP}}a:
   - Access values via dot notation: `flag-name.property`. Apply events are sent automatically — no manual tracking needed.
     {{FLAG_GUIDANCE}}

After wiring each flag, print: STATUS: Integrated flag: <flag-name>

Use the SDK API from the docs guide fetched in step {{SDK_STEP}} — do not improvise SDK APIs from memory.
