type EnvKey = 'NODE_ENV' | 'CI' | 'DEBUG' | 'CONFIDENCE_API_KEY' | 'CONFIDENCE_TELEMETRY';

export function getEnv(key: EnvKey): string | undefined {
  return process.env[key];
}

export function isCI(): boolean {
  return getEnv('CI') === 'true';
}

export function isDebug(): boolean {
  return getEnv('DEBUG') === 'true';
}
