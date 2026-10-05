import { detectPackageManager } from '@features/update/detect-pm.js';

let savedUserAgent: string | undefined;
let savedNpmCommand: string | undefined;
let savedExecpath: string | undefined;
let savedArgv: string[];

beforeEach(() => {
  savedUserAgent = process.env.npm_config_user_agent;
  savedNpmCommand = process.env.npm_command;
  savedExecpath = process.env.npm_execpath;
  savedArgv = process.argv;

  delete process.env.npm_config_user_agent;
  delete process.env.npm_command;
  delete process.env.npm_execpath;
});

afterEach(() => {
  process.env.npm_config_user_agent = savedUserAgent;
  process.env.npm_command = savedNpmCommand;
  process.env.npm_execpath = savedExecpath;
  process.argv = savedArgv;
});

describe('detectPackageManager', () => {
  describe('ephemeral runners', () => {
    it('detects legacy npx via user agent', () => {
      process.env.npm_config_user_agent = 'npx/10.8.2 npm/10.8.2 node/v22.7.0';

      expect(detectPackageManager()).toBe('npx');
    });

    it('detects modern npx via npm_command=exec', () => {
      process.env.npm_config_user_agent = 'npm/10.8.2 node/v22.7.0 darwin arm64';
      process.env.npm_command = 'exec';

      expect(detectPackageManager()).toBe('npx');
    });

    it('detects pnpm dlx via npm_execpath', () => {
      process.env.npm_execpath = '/home/user/.local/share/pnpm/dlx/confidence';
      process.argv = [process.argv[0], '/home/user/.local/share/pnpm/store/confidence'];

      expect(detectPackageManager()).toBe('npx');
    });

    it('detects yarn dlx via npm_execpath', () => {
      process.env.npm_execpath = '/home/user/.config/yarn/dlx/confidence';
      process.argv = [process.argv[0], '/home/user/.config/yarn/global/confidence'];

      expect(detectPackageManager()).toBe('npx');
    });

    it('prioritises npx over install-path detection', () => {
      process.env.npm_command = 'exec';
      process.argv = [process.argv[0], '/home/user/.local/share/pnpm/store/confidence'];

      expect(detectPackageManager()).toBe('npx');
    });
  });

  describe('install path detection', () => {
    it('detects pnpm from script path', () => {
      process.argv = [process.argv[0], '/home/user/.local/share/pnpm/store/confidence'];

      expect(detectPackageManager()).toBe('pnpm');
    });

    it('detects pnpm from Windows script path', () => {
      process.argv = [process.argv[0], 'C:\\Users\\user\\AppData\\pnpm\\confidence'];

      expect(detectPackageManager()).toBe('pnpm');
    });

    it('detects yarn from script path', () => {
      process.argv = [process.argv[0], '/home/user/.config/yarn/global/confidence'];

      expect(detectPackageManager()).toBe('yarn');
    });

    it('detects bun from script path', () => {
      process.argv = [process.argv[0], '/home/user/.bun/bin/confidence'];

      expect(detectPackageManager()).toBe('bun');
    });

    it('detects npm from script path', () => {
      process.argv = [process.argv[0], '/usr/local/lib/node_modules/npm/bin/confidence'];

      expect(detectPackageManager()).toBe('npm');
    });

    it('ignores user agent when install path is available', () => {
      process.env.npm_config_user_agent = 'pnpm/9.1.0 npm/? node/v22.7.0';
      process.argv = [process.argv[0], '/usr/local/lib/node_modules/npm/bin/confidence'];

      expect(detectPackageManager()).toBe('npm');
    });
  });

  describe('fallback', () => {
    it('defaults to npm when no signals match', () => {
      process.argv = [process.argv[0], '/usr/local/bin/confidence'];

      expect(detectPackageManager()).toBe('npm');
    });
  });
});
