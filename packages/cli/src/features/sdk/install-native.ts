import type { InstallCommand } from './install-types.js';

export function buildGoInstall(pkg: string): InstallCommand {
  return { type: 'auto', cmd: 'go', args: ['get', pkg] };
}

export function buildSwiftInstall(pkg: string): InstallCommand {
  return {
    type: 'manual',
    snippet:
      `Add the following to your Package.swift dependencies:\n\n` +
      `  .package(\n` +
      `      url: "https://github.com/spotify/${pkg}.git",\n` +
      `      from: "<version>"\n` +
      `  )`,
  };
}
