import { CONFIDENCE_DOCS_URL } from '../constants.js';
import { loadStep } from './steps/load.js';

const REACT_GOTCHAS = `

**React/Next.js gotchas:**
- Next.js App Router: use \`ConfidenceProvider\` in the root layout. Server Components use \`getFlag('flag.prop', default, context)\`; Client Components use the \`useFlag('flag.prop', default)\` hook. If using the client provider, the rendering file must be a Client Component — extract into \`providers.tsx\` with \`"use client"\` if needed.
- Never call \`useFlag\` in a Server Component — use \`getFlag\` or wrap in a Client Component.
- Place the provider above any \`<Suspense>\` boundary.`;

const FLAG_GUIDANCE_EMPTY =
  '   - Wire each flag into the sample app so running it demonstrates the flag in action (e.g. the app outputs different text, enables a feature, or changes its behavior based on the flag value).\n   - The sample app should be a self-contained working example of Confidence flag evaluation — a user running it should immediately see that flags control behavior.';

const FLAG_GUIDANCE_EXISTING =
  '   - Integrate each flag at its chosen insertion point. The change should be minimal (under 20 lines per flag) and immediately visible when toggled.\n   - The default variant must produce the current behavior — safe to merge with no visible change until the flag is flipped.';

export function integrateSDK(
  step: number,
  sdkStep: number,
  isEmptyProject: boolean,
  toolVars: Record<string, string>,
): string {
  const vars = { STEP: step, DOCS_URL: CONFIDENCE_DOCS_URL, ...toolVars };

  const analyze = loadStep('integrate-analyze.md', {
    ...vars,
    DOMAIN_CONTEXT: isEmptyProject
      ? "The project was just scaffolded, so treat the sample app's features as the domain."
      : "Study the project's codebase to understand its domain, UI flows, and business logic.",
    INSERTION_HINT: isEmptyProject
      ? 'For fresh scaffolds, use the scaffold\'s default heading or welcome text as the insertion point — the "aha" moment works just as well on boilerplate. Demonstrate at least two use cases (e.g. a gradual rollout for a heading change and a kill switch for a feature section) so the user sees the range of what flags can do.'
      : 'Read the top 2–3 candidate files and pick the best one: a single visible string or component, no complex conditionals already wrapping it, in a file the user will recognize.',
    CODE_CONTEXT: isEmptyProject ? "sample app's features" : "project's actual code",
  });

  const flags = loadStep('integrate-create-flags.md', vars);
  const install = loadStep('integrate-install.md', vars);

  const code = loadStep('integrate-code.md', {
    ...vars,
    SDK_STEP: sdkStep,
    REACT_GOTCHAS: isEmptyProject ? '' : REACT_GOTCHAS,
    FLAG_GUIDANCE: isEmptyProject ? FLAG_GUIDANCE_EMPTY : FLAG_GUIDANCE_EXISTING,
  });

  const verify = loadStep('integrate-verify.md', vars);

  return `## ${step}. Integrate SDK\n\n${analyze}\n\n${flags}\n\n${install}\n\n${code}\n\n${verify}`;
}
