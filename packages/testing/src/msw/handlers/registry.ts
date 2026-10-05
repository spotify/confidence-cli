import { http, HttpResponse } from 'msw';

export const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@spotify-confidence/cli/latest';

export function registryReturns(version: string) {
  return http.get(NPM_REGISTRY_URL, () => HttpResponse.json({ version }));
}

export function registryFails() {
  return http.get(NPM_REGISTRY_URL, () => HttpResponse.error());
}
