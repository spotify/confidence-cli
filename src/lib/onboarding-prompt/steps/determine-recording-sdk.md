## {{STEP}}. Determine Session Recording SDK

Print "STATUS: Checking session recording availability..."

Confidence Session Recording is currently available as a browser SDK: `@spotify-confidence/session-recording`.
It captures DOM events in real time and streams them to the Confidence backend for replay and analysis.

Check whether the project is a browser-based application (React, Next.js, Vue, Svelte, plain JS/TS with a DOM).

- If yes: print "STATUS: Session recording supported — proceeding." and continue.
- If not (Node.js server, Go, Python, Swift, Kotlin, Java, etc.): print "STATUS: Session recording not supported — skipping." and skip to the report step.

If docs MCP tools are available (from preflight):

- Call `{{DOCS_searchDocumentation}}` with query "session recording integration".
- If results mention a session recording SDK, call `{{DOCS_getCodeSnippetAndSdkIntegrationTips}}` to get the integration guide.

If docs MCP tools are NOT available:

- Search the web for "Confidence session recording" at {{DOCS_URL}}, or check https://github.com/spotify/confidence-sdk-js for the latest API.
