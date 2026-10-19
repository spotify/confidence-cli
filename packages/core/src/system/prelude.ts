// Side-effect module — import before chalk/ora/ink to set env vars early.
if (process.argv.includes('--no-color') || 'NO_COLOR' in process.env) {
  process.env.FORCE_COLOR = '0';
}
