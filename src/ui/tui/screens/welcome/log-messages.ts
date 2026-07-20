import type { LogMessage } from '../../lib/log-messages.js';

export function welcomeMenuSelect(opts: {
  label: string;
  dir: string;
  framework: string | null;
  source: string | null;
}): LogMessage {
  return {
    input: opts.label,
    output: `dir=${opts.dir}, framework=${opts.framework ?? 'none'} (${opts.source ?? 'n/a'})`,
  };
}
