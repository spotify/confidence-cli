## {{STEP}}. Integrate Session Recording

Print "STATUS: Setting up session recording..."

The detected framework is **{{FRAMEWORK}}**.

{{SKILL_READ_INSTRUCTION}} — use it for how to check platform compatibility, scan for consent tools, set up recording policies and rules, which SDK to install, how to initialize the recorder, and how to configure privacy and capture settings. Ignore its output formatting entirely: no step tracker, no EDUCATE blocks, no AskUserQuestion calls.

Execute the skill's workflow automatically, without pausing for user input:

- **Discovery** (skill steps 1–2): check whether the platform supports session recording (browser-based only), scan the project for the entry point and existing consent tools.
- **Setup** (skill steps 3–4): resolve or create the Confidence client and recording policy, create and enable the recording rule.
- **Integration** (skill steps 5–8): install the session recording SDK, initialize the recorder, configure privacy and capture settings, verify the build.

If the skill's platform check determines session recording is not supported (non-browser project), print "STATUS: Session recording not supported — skipping." and skip to the next step.

{{DOMAIN_CONTEXT}}

**Example STATUS lines for this step:**

- "STATUS: Checking session recording availability..."
- "STATUS: Session recording supported — proceeding."
- "STATUS: Session recording not supported — skipping."
- "STATUS: Analyzing project for session recording..."
- "STATUS: Scanning for consent tools..."
- "STATUS: Setting up recording policy..."
- "STATUS: Created recording policy: <name>"
- "STATUS: Reusing recording policy: <name>"
- "STATUS: Enabled recording rule"
- "STATUS: Installing session recording SDK..."
- "STATUS: Adding session recording provider..."
- "STATUS: Writing <file>..."
- "STATUS: Configuring privacy and capture settings..."
- "STATUS: Verifying project builds..."
- "STATUS: Fixing build errors..."

Note: when naming project files, use file name only, no path.

**Session-recording guardrails:**

- Read the client secret from the env var the browser can actually read. Use the framework-specific prefix: `VITE_CONFIDENCE_CLIENT_SECRET` for Vite, `NEXT_PUBLIC_CONFIDENCE_CLIENT_SECRET` for Next.js, `REACT_APP_CONFIDENCE_CLIENT_SECRET` for Create React App, or follow the framework's public-env convention. Write the secret to `.env`, ensure `.env` is in `.gitignore`, and never echo the secret in STATUS lines, the report, or generated source. Fill `<CLIENT_SECRET_ENV>` in the report with the chosen env var name.
- Name clients after the project, never after the framework — a framework name collides with clients from unrelated projects.
- If a consent tool was found, pass `mode: 'manual'` to `initSessionRecorder` and call `recorder.start()` only after analytics or recording consent is granted. Fill `<RECORDING_CONSENT_STATUS>` accordingly.
- Only include privacy and capture options that differ from defaults in the `initSessionRecorder` call — don't add `maskInputs: true` or `captureRouteChanges: true` since they're already on.
- If feature flags were already integrated in a previous step, pass the same identity field in `context` so sessions correlate with flag evaluations.
- Fill the report placeholders: `<RECORDING_RULE_STATUS>` with the rule outcome ("The recording rule is enabled — sessions are captured once the app runs with the client secret", or "No recording rule was created — create a policy and rule under Recordings > Settings before sessions will be captured", or "The existing recording rule records nobody — delete it under Recordings > Settings and add a new one"). Fill `<RECORDING_CONSENT_STATUS>` with the consent outcome ("Recording starts only after the user grants analytics or recording consent", or "No consent tool was found — recording starts when the app loads; mention session recording in the privacy policy and gate it behind consent where required (e.g. EU)").
