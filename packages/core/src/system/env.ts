type EnvKey =
  | 'NODE_ENV'
  | 'CI'
  | 'DEBUG'
  | 'CONFIDENCE_API_KEY'
  | 'CONFIDENCE_TOKEN'
  | 'CONFIDENCE_CONFIG_DIR'
  | 'CONFIDENCE_TELEMETRY'
  | 'CONFIDENCE_AUTH_DOMAIN'
  | 'CONFIDENCE_AUTH_URL'
  | 'CONFIDENCE_ORGANIZATION'
  | 'CONFIDENCE_SKILLS_URL'
  | 'CONFIDENCE_MCP_URL'
  | 'CONFIDENCE_TELEMETRY_KEY_URL'
  | 'CONFIDENCE_TELEMETRY_EVENTS_URL'
  | 'CONFIDENCE_API_BASE_URL';

export function env(key: EnvKey): string | undefined;
export function env(key: EnvKey, defaultValue: string): string;
export function env(key: EnvKey, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue;
}

export function isCI(): boolean {
  return env('CI') === 'true';
}

export function isDebug(): boolean {
  return env('DEBUG') === 'true';
}

export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY) && !isCI();
}
