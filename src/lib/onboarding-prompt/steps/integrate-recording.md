## {{STEP}}. Integrate Session Recording

Skip this step if the previous step determined that session recording is not available for this platform.

### {{STEP}}a. Analyze project for recording integration

Print "STATUS: Analyzing project for session recording..."

{{ANALYSIS_CONTEXT}}

**Detect the source root** — check for `src`, `app`, `lib`, `pages`, `server` and use the first match (or `.`). Exclude `node_modules`, `.venv`, `vendor`, `target`, `build`, `dist`, `.next`, `__pycache__` from scans.

### {{STEP}}b. Install the session recording SDK

Print "STATUS: Installing session recording SDK..."

```bash
npm install @spotify-confidence/session-recording
# or: yarn add / pnpm add
```

### {{STEP}}c. Initialize the recorder

Print "STATUS: Adding session recording provider..."

Add to the app's entry point (e.g. `main.ts`, `index.tsx`, root layout):

```ts
import { initSessionRecorder } from '@spotify-confidence/session-recording';

const recorder = initSessionRecorder({
  clientSecret: process.env.CONFIDENCE_CLIENT_SECRET,
  // context should match the evaluation context used for feature flags
  context: {
    visitor_id: '<stable user or visitor id>',
  },
});
```

The recorder starts automatically by default. For manual control, pass `mode: 'manual'` and call `recorder.start()`.

### {{STEP}}d. Configure privacy and capture settings

Print "STATUS: Configuring privacy and capture settings..."

Scan the project's components and templates to determine the right configuration. The available options are:

**Privacy** (what to hide from recordings):

- `maskInputs` (boolean, default `true`) — masks all `<input>`, `<textarea>`, and contenteditable values. Keep enabled unless the app has no user input.
- `maskSelectors` (string[]) — CSS selectors for elements whose text should be replaced with bullet characters. Masking preserves layout but hides content.
- `blockSelectors` (string[]) — CSS selectors for elements to remove from recordings entirely. Use for heavy or irrelevant content, not for text you want to stay visible.

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

If the project already uses Confidence feature flags, pass the same `targeting_key` / `visitor_id` in `context` so sessions correlate with flag evaluations.

### {{STEP}}e. Verify the project builds

Print "STATUS: Verifying project builds..."

Run the project's build or type-check command to catch errors early:

- JS/TS: prefer the project's own `build` script, fall back to `tsc --noEmit` if tsconfig.json exists, skip otherwise.

If the build fails, read the errors, fix the integration code, and re-check before continuing.
