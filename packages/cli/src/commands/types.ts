import type { OutputFormat } from '@output/detect.js';

export type GlobalFlags = {
  json: boolean;
  output?: OutputFormat;
  project?: string;
  environment?: string;
  profile?: string;
  debug: boolean;
  'dry-run': boolean;
  'no-color': boolean;
};
