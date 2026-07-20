export type Tip = {
  title: string;
  body: string;
  url: string;
};

export const CONFIDENCE_TIPS: Tip[] = [
  {
    title: 'Keep flag names short',
    body: 'Use descriptive but concise flag keys like "new-checkout" — avoid encoding config details in the name like "new-checkout-enabled-mobile".',
    url: 'https://confidence.spotify.com/docs/how-to-guides/create-flag',
  },
  {
    title: 'Flags are structured objects',
    body: 'Each flag in Confidence is a structured object with typed properties. Access them with dot notation: "my-flag.enabled", "my-flag.variant".',
    url: 'https://confidence.spotify.com/docs/flags/create-flags',
  },
  {
    title: 'Use MCP for flag management',
    body: 'With Confidence MCP tools connected, you can create flags, add variants, set targeting rules, and test resolution — all from your AI assistant.',
    url: 'https://confidence.spotify.com/docs/quickstarts/use-mcp',
  },
  {
    title: 'Run experiments in your warehouse',
    body: 'Confidence runs A/B tests directly in your data warehouse (BigQuery, Snowflake, Redshift, Databricks) — your data never leaves your infrastructure.',
    url: 'https://confidence.spotify.com/docs/introduction',
  },
  {
    title: 'OpenFeature compatible',
    body: 'Confidence SDKs implement the OpenFeature standard. You can swap providers without changing your application code.',
    url: 'https://confidence.spotify.com/docs/sdks/introduction',
  },
  {
    title: 'Batch flag resolves on mobile',
    body: 'Mobile and web SDKs batch-resolve flags in a single request, reducing network overhead and improving startup performance.',
    url: 'https://confidence.spotify.com/docs/sdks/introduction',
  },
  {
    title: 'Set evaluation context early',
    body: 'Provide targeting key and attributes (user ID, country, plan) as early as possible — flag values depend on context for consistent assignment.',
    url: 'https://confidence.spotify.com/docs/api/flags/concepts',
  },
  {
    title: 'Try the local resolver',
    body: 'For lower latency and better resilience, check out the Confidence Local Resolver — it evaluates flags locally via WebAssembly without per-evaluation network calls.',
    url: 'https://confidence.spotify.com/docs/flags/local-resolver',
  },
];
