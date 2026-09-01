import { env } from './env.js';

export const CONFIDENCE_SITE_URL = 'https://confidence.spotify.com/';
export const CONFIDENCE_DOCS_URL = 'https://confidence.spotify.com/docs';
export const CONFIDENCE_DASHBOARD_URL = 'https://app.confidence.spotify.com';

export const PLUGIN_REPO_URL = 'https://github.com/spotify/confidence-ai-plugins/';
export const PLUGIN_MARKETPLACE_REPO = 'spotify/confidence-ai-plugins';
export const PLUGIN_MARKETPLACE_NAME = 'confidence';
export const PLUGIN_NAME = 'confidence';

export const SKILLS_BASE_URL = env(
  'CONFIDENCE_SKILLS_URL',
  'https://raw.githubusercontent.com/spotify/confidence-ai-plugins/main/skills',
);
