import type { PluginInstallationMethod } from '@integrations/types.js';
import type { ChosenIde } from '../../session.js';
import { loadStep } from '../steps/load.js';
import { referenceInstruction } from '../tool-vars.js';

export function integrateViaSkill(
  framework: string,
  step: number,
  isEmptyProject: boolean,
  ide: ChosenIde,
  pluginInstallMethod?: PluginInstallationMethod | null,
): string {
  const needsReactGotchas = /react|nextjs|next/i.test(framework);

  return loadStep('integrate-via-skill.md', {
    STEP: step,
    FRAMEWORK: framework,
    SKILL_READ_INSTRUCTION: referenceInstruction('analyze-project', ide, pluginInstallMethod),

    DOMAIN_CONTEXT: isEmptyProject
      ? "The project was just scaffolded — treat the sample app's features as the domain."
      : 'The project is an existing codebase. Study its code to understand the domain, UI flows, and business logic.',

    INSERTION_HINT: isEmptyProject
      ? 'For fresh scaffolds, use the scaffold\'s default heading or welcome text as the insertion point — the "aha" moment works just as well on boilerplate. Demonstrate at least two use cases (e.g. a gradual rollout for a heading change and a kill switch for a feature section).'
      : 'Read the top 2–3 candidate files and pick the best one: a single visible string or component, no complex conditionals already wrapping it, in a file the user will recognize.',

    FLAG_GUIDANCE: isEmptyProject ? FLAG_GUIDANCE_EMPTY : FLAG_GUIDANCE_EXISTING,
    REACT_GOTCHAS: needsReactGotchas ? REACT_GOTCHAS : '',
  });
}

const REACT_GOTCHAS = `

**React/Next.js — MANDATORY SDK selection:**
- DO NOT install \`@spotify-confidence/react\`, \`@spotify-confidence/sdk\`, or \`@openfeature/react-sdk\` — these are deprecated and must not be used even if other sources mention them.
- Use \`@spotify-confidence/openfeature-server-provider-local\` — it is the recommended SDK for both React and Next.js. It uses local evaluation via WebAssembly for fast flag resolution.
- For Next.js: import \`ConfidenceProvider\` from \`@spotify-confidence/openfeature-server-provider-local/react-server\`, use \`getFlag\` in Server Components and \`useFlag\` in Client Components.
- Only fall back to \`@spotify-confidence/openfeature-web-provider\` when the project requires client-side context modifications that local resolve cannot support.
- Place the provider above any \`<Suspense>\` boundary.
- If using the client provider, the rendering file must be a Client Component — extract into \`providers.tsx\` with \`"use client"\` if needed.`;

const FLAG_GUIDANCE_EMPTY =
  '   - Wire each flag into the sample app so running it demonstrates the flag in action (e.g. the app outputs different text, enables a feature, or changes its behavior based on the flag value).\n   - The sample app should be a self-contained working example of Confidence flag evaluation — a user running it should immediately see that flags control behavior.';

const FLAG_GUIDANCE_EXISTING =
  '   - Integrate each flag at its chosen insertion point. The change should be minimal (under 20 lines per flag) and immediately visible when toggled.\n   - The default variant must produce the current behavior — safe to merge with no visible change until the flag is flipped.';
