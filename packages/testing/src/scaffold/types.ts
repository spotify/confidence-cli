/**
 * Identifies a pre-built project scaffold.
 *
 * Each variant produces a minimal project directory that triggers a
 * specific code path in the wizard's framework-detection or
 * provider-detection logic.
 *
 * **Framework scaffolds:**
 * - `'empty'` — bare directory (forces manual framework selection)
 * - `'react'` — `package.json` with React 19
 * - `'nextjs'` — React + Next.js 15
 *
 * **Provider scaffolds (npm):**
 * - `'react-eppo'` — React + Eppo SDK
 * - `'react-statsig'` — React + Statsig SDK
 * - `'react-posthog-statsig'` — React + PostHog + Statsig
 * - `'optimizely'` — Optimizely SDK only
 * - `'posthog'` — PostHog SDK only
 * - `'statsig'` — Statsig SDK only
 * - `'statsig-node'` — Statsig Node SDK in dev dependencies
 *
 * **Provider scaffolds (Python):**
 * - `'python-posthog'` — `requirements.txt` with PostHog
 * - `'python-statsig'` — `pyproject.toml` with Statsig
 */
export type ProjectType =
  | 'empty'
  | 'react'
  | 'nextjs'
  | 'react-eppo'
  | 'react-statsig'
  | 'react-posthog-statsig'
  | 'optimizely'
  | 'posthog'
  | 'statsig'
  | 'statsig-node'
  | 'python-posthog'
  | 'python-statsig';
