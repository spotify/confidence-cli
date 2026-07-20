## {{STEP}}. Determine SDK

Print "STATUS: Determining the right Confidence SDK..."

Confidence SDKs come in two flavors:

- **Server** (Node.js/TS, Next.js, Go, Java, Rust, Python, Ruby, .NET, PHP): local evaluation via Rust-based WASM resolver — microsecond latency, no per-evaluation network calls.
- **Client** (React/browser JS, Swift/iOS, Kotlin/Android, Flutter, Unity): resolve once per evaluation context and cache locally.

Based on the framework ({{FRAMEWORK}}), fetch the integration guide:

If docs MCP tools are available (from preflight):

- Server SDKs: call `{{DOCS_getLocalResolveIntegrationGuide}}` with the matching sdk param.
- Client SDKs: call `{{DOCS_getCodeSnippetAndSdkIntegrationTips}}` with the matching sdk param.

If docs MCP tools are NOT available:

- Search the web for the Confidence SDK guide for {{FRAMEWORK}} at {{DOCS_URL}}.

The guide contains package names, provider setup, and flag evaluation patterns. All SDKs implement the OpenFeature specification.
