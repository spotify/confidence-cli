## {{STEP}}. Integrate Session Recording

Skip this step if the previous step determined that session recording is not available for this platform.

### {{STEP}}a. Analyze project for recording integration

Print "STATUS: Analyzing project for session recording..."

{{ANALYSIS_CONTEXT}}

**Detect the source root** — check for `src`, `app`, `lib`, `pages`, `server` and use the first match (or `.`). Exclude `node_modules`, `.venv`, `vendor`, `target`, `build`, `dist`, `.next`, `__pycache__` from scans.

**Consent tool** — look for an existing consent or cookie-banner implementation: OneTrust, Cookiebot, Usercentrics, Didomi, `react-cookie-consent`, a custom consent context, or a cookie-consent state hook. Note whether analytics or recording consent is already modeled. You will use this in {{STEP}}d.

### {{STEP}}b. Resolve client and recording policy

Print "STATUS: Setting up recording policy..."

If flag management is unavailable from preflight, skip MCP calls in this substep. Write placeholders for the client secret and document in the report that the user must create a recording policy under Recordings > Settings. Fill `<RECORDING_RULE_STATUS>` with "No recording rule was created — create a policy and rule under Recordings > Settings before sessions will be captured". If they need setup details, search {{DOCS_URL}}.

If flag management is available:

1. **Client** — reuse the Confidence client from an earlier feature-flags step if one was created in this same run. Otherwise call `{{FLAGS_createClient}}` with the display name "{{PROJECT_NAME}}" and `clientType` `Frontend`. Name it after this project, never after the framework — a framework name collides with clients from unrelated projects and attaches this policy to the wrong app. Keep the returned resource name (`clients/<id>` from `name:`).

   Do not reuse a client solely because its display name already exists. A folder named `app`, `web`, or `frontend` often belongs to a different project. If `{{FLAGS_createClient}}` reports that display name is taken, call it again with a unique name: "{{PROJECT_NAME}} ({{PARENT_NAME}})", then "{{PROJECT_NAME}}-2", then "-3", until creation succeeds — unless the colliding client is the one created earlier in this same run, in which case keep that resource name. Never call `{{FLAGS_getClientSecret}}` for a colliding client you did not create in this run.

2. **Targeting key** — same as flags. Call `{{FLAGS_getContextSchema}}` with the client's display name. Use the first available entity field (typically `visitor_id`). Do not assume `user_id` or `targeting_key`. If feature flags were integrated earlier, reuse that entity field. If the schema has no entity field, call `{{FLAGS_addContextField}}` with `fieldName` `visitor_id`, `fieldType` `string`, and `isEntity` `"true"` (string, not boolean). Fill it with a persisted visitor ID: reuse the flag identity if present, otherwise an existing anonymous/device ID, or generate once and store where the app already persists client state (`localStorage` only in a browser entrypoint).

3. **Policy** — never reuse a policy because its display name looks similar. Call `{{FLAGS_listRecordingPolicies}}` and inspect every page: pass each non-empty `nextPageToken` back as `pageToken` until `nextPageToken` is empty. Reuse a policy only when its `clients` list contains this client's resource name (`clients/<id>`). If nothing matches, call `{{FLAGS_createRecordingPolicy}}` with `displayName` "{{PROJECT_NAME}} Session Recording" and `clientName` set to this client's resource name. Keep the returned policy resource name.

4. **Rule** — call `{{FLAGS_getRecordingPolicy}}` with `recordingPolicy` set to that resource name. If the policy has no rule yet, call `{{FLAGS_addRecordingRule}}` like this:

   Good: `targetingKeySelector` from the **Targeting key** item in {{STEP}}b, omit `targetingJson`, `stableAudiencePercentage`: 100, `sessionSampleRate`: 1, `enabled`: true
   Bad: omitting the percentages (agents often send `0`, which records nobody)

   Pass `recordingPolicy` (the resource name from the **Policy** item in {{STEP}}b) and `displayName` "Record all visitors".

   Selecting Session Recordings in the wizard is explicit confirmation to start recording, so enable the rule immediately without asking another question. The MCP creates an unrestricted `segments/<id>` audience even though `targetingJson` is omitted. Tell the user afterward that the rule is enabled and records 100% of visitors and sessions. Fill `<RECORDING_RULE_STATUS>` with "The recording rule is enabled — sessions are captured once the app runs with the client secret".

   If the policy already has a rule that is not enabled, call `{{FLAGS_setRecordingRuleEnabled}}` with that rule's resource name and `enabled` true.

   When reusing an existing rule, read its audience from the `{{FLAGS_getRecordingPolicy}}` output. An audience segment (`segments/<id>`) is the healthy 100%-of-visitors representation, including rules with no targeting conditions. An audience of "all users" means the pre-fix rule has no segment, which records nobody and no MCP tool can repair — print "STATUS: Existing recording rule records nobody" and add a "Before you merge" item telling the user to delete that rule under Recordings > Settings and add a new one. Fill `<RECORDING_RULE_STATUS>` with "The existing recording rule records nobody — delete it under Recordings > Settings and add a new one".

Print "STATUS: Created recording policy: <policy-name>" after a new policy, or "STATUS: Reusing recording policy: <policy-name>" when reusing. Print "STATUS: Enabled recording rule" after the rule is active.

In the final change summary, include "Created recording policy with targeting key" and "Created recording rule (Record all visitors, 100% audience, 100% sessions, enabled)" when those resources were created.

### {{STEP}}c. Install the session recording SDK

Print "STATUS: Installing session recording SDK..."

```bash
npm install @spotify-confidence/session-recording
# or: yarn add / pnpm add
```

### {{STEP}}d. Initialize the recorder

Print "STATUS: Adding session recording provider..."

Pick the env var the browser can actually read, then write the Frontend client secret to `.env` under that exact name (exposing it to the browser is intended). Use the same name in generated code and fill `<CLIENT_SECRET_ENV>` in the report:

- Vite: `VITE_CONFIDENCE_CLIENT_SECRET` via `import.meta.env.VITE_CONFIDENCE_CLIENT_SECRET`
- Next.js client code: `NEXT_PUBLIC_CONFIDENCE_CLIENT_SECRET` via `process.env.NEXT_PUBLIC_CONFIDENCE_CLIENT_SECRET`
- Create React App: `REACT_APP_CONFIDENCE_CLIENT_SECRET` via `process.env.REACT_APP_CONFIDENCE_CLIENT_SECRET`
- Other browser bundlers: follow that framework's public-env convention
- Server-only entrypoints: `CONFIDENCE_CLIENT_SECRET` via `process.env.CONFIDENCE_CLIENT_SECRET`

Ensure `.env` is in `.gitignore`, and never echo the secret in STATUS lines, the report, or generated source.

Add to the app's entry point (e.g. `main.ts`, `index.tsx`, root layout). Replace the clientSecret access with the pattern from above:

```ts
import { initSessionRecorder } from '@spotify-confidence/session-recording';

const recorder = initSessionRecorder({
  clientSecret: import.meta.env.VITE_CONFIDENCE_CLIENT_SECRET,
  context: {
    visitor_id: '<stable user or visitor id>',
  },
});
```

Use the same field name as `targetingKeySelector`, filled with the identity from the **Targeting key** item in {{STEP}}b. Rename `visitor_id` in this snippet if the schema's first entity field is different.

The function always returns a `SessionRecorder` — safe to call, never throws.

**Start mode** — if {{STEP}}a found a consent tool, pass `mode: 'manual'` and call `recorder.start()` only after analytics or recording consent is granted. Fill `<RECORDING_CONSENT_STATUS>` with "Recording starts only after the user grants analytics or recording consent". If none was found, keep the SDK default (recording starts automatically) and fill `<RECORDING_CONSENT_STATUS>` with "No consent tool was found — recording starts when the app loads; mention session recording in the privacy policy and gate it behind consent where required (e.g. EU)".

### {{STEP}}e. Configure privacy and capture settings

Print "STATUS: Configuring privacy and capture settings..."

Scan the project's components and templates to determine the right configuration. The available options are:

**Privacy** (what to hide from recordings):

- `maskInputs` (boolean, default `true`) — masks all `<input>`, `<textarea>`, and contenteditable values. Keep enabled unless the app has no user input.
- `maskSelectors` (string[]) — CSS selectors for elements whose text should be replaced with bullet characters. Masking preserves layout but hides content.
- `blockSelectors` (string[]) — CSS selectors for elements to remove from recordings entirely (replaced with empty placeholders). Use for heavy or irrelevant content, not for text you want to stay visible.

**Capture** (what extra data to collect):

- `captureConsoleLogs` (boolean, default `false`) — capture browser console output. Enable if the app logs user-facing errors or diagnostics.
- `captureNetworkRequests` (boolean, default `false`) — capture fetch/XHR metadata (URL, method, status). Enable for debugging API-dependent flows.
- `captureRouteChanges` (boolean, default `true`) — capture client-side navigation. Disable only for single-page apps with no routing.

**Route normalization**:

- `parameterizeRoute` (function) — normalizes dynamic URL segments (e.g. `/users/123` → `/users/:id`). The default handles common patterns. Add a custom function only if the app uses non-standard URL structures.

Analyze the project to decide:

1. **maskSelectors** — look for elements displaying PII (user names, emails, addresses, account numbers). Check for CSS classes like `.user-info`, `.profile`, `.account`, or data attributes like `[data-pii]`, `[data-sensitive]`. If found, add them. If the project has no obvious PII display, leave empty.
2. **blockSelectors** — look for `<video>`, `<iframe>`, third-party widget containers, or ad slots. These add recording size without analysis value. Block them if present.
3. **captureConsoleLogs** — enable if the app uses `console.error` or `console.warn` for user-visible diagnostics.
4. **captureNetworkRequests** — enable if the app makes API calls that affect the UI (e.g. data fetching, form submissions).

Merge the chosen settings into the `initSessionRecorder` call from the previous step. Only include options that differ from defaults — don't add `maskInputs: true` or `captureRouteChanges: true` since they're already on.

If the project already uses Confidence feature flags, pass the same identity field in `context` so sessions correlate with flag evaluations.

### {{STEP}}f. Verify the project builds

Print "STATUS: Verifying project builds..."

Run the project's build or type-check command to catch errors early:

- JS/TS: prefer the project's own `build` script, fall back to `tsc --noEmit` if tsconfig.json exists, skip otherwise.

If the build fails, read the errors, fix the integration code, and re-check before continuing.
