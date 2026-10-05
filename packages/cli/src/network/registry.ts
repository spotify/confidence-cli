const REGISTRY_URL = 'https://registry.npmjs.org/@spotify-confidence/cli/latest';

export async function fetchLatestVersion(): Promise<string> {
  const res = await fetch(REGISTRY_URL);
  if (!res.ok) throw new Error(`Registry returned ${res.status}`);
  const data = (await res.json()) as { version: string };
  return data.version;
}
