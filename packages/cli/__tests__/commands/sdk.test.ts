import yargs from 'yargs';
import { sdkCommand } from '@commands/sdk.js';
import { captureOutput } from '../helpers/capture.js';

const mockCallMcpTool = vi.fn().mockResolvedValue('npm install @spotify-confidence/sdk');
const mockExecFile = vi.fn().mockResolvedValue({ stdout: '', stderr: '' });
const mockDetectFramework = vi.fn();
const mockDetectPackageManager = vi.fn().mockReturnValue('npm');

vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    callMcpTool: (...args: unknown[]) => mockCallMcpTool(...args),
    execFile: (...args: unknown[]) => mockExecFile(...args),
    detectFramework: (...args: unknown[]) => mockDetectFramework(...args),
    detectPackageManager: (...args: unknown[]) => mockDetectPackageManager(...args),
  };
});

const REACT_FRAMEWORK = {
  id: 'react',
  name: 'React',
  sdkPackage: '@spotify-confidence/sdk',
  docsUrl: 'https://confidence.spotify.com/docs/sdks/client/javascript',
};

const PYTHON_FRAMEWORK = {
  id: 'python',
  name: 'Python',
  sdkPackage: 'confidence-openfeature-provider',
  docsUrl: 'https://confidence.spotify.com/docs/sdks/server/python',
};

const KOTLIN_FRAMEWORK = {
  id: 'kotlin',
  name: 'Android (Kotlin)',
  sdkPackage: 'com.spotify.confidence:openfeature-provider-android',
  docsUrl: 'https://confidence.spotify.com/docs/sdks/client/android',
};

beforeEach(() => {
  vi.clearAllMocks();
});

function run(args: string[]) {
  return yargs(args)
    .option('json', { type: 'boolean', default: false })
    .option('output', { type: 'string' })
    .option('project', { type: 'string' })
    .command(sdkCommand)
    .parse();
}

describe('sdk list', () => {
  it('outputs available SDKs as JSON', async () => {
    using output = captureOutput();

    await run(['sdk', 'list', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ package: '@spotify-confidence/sdk' }),
        expect.objectContaining({
          name: 'Python',
          package: 'confidence-openfeature-provider',
        }),
        expect.objectContaining({
          package: 'github.com/spotify/confidence-resolver/openfeature-provider/go',
        }),
      ]),
    );
  });

  it('deduplicates SDKs sharing the same package', async () => {
    using output = captureOutput();

    await run(['sdk', 'list', '--json']);

    const parsed = JSON.parse(output.stdout);
    const packages = parsed.data.map((s: { package: string }) => s.package);
    expect(packages).toEqual([...new Set(packages)]);
  });

  it('outputs available SDKs as a table', async () => {
    using output = captureOutput();

    await run(['sdk', 'list', '--output', 'table']);

    expect(output.stdout).toContain('SDK');
    expect(output.stdout).toContain('Package');
  });
});

describe('sdk install', () => {
  it('detects framework and installs SDK via docs lookup', async () => {
    using _output = captureOutput();
    mockDetectFramework.mockResolvedValue(REACT_FRAMEWORK);
    mockCallMcpTool.mockResolvedValue('npm install @spotify-confidence/sdk');

    await run(['sdk', 'install']);

    expect(mockDetectFramework).toHaveBeenCalled();
    expect(mockCallMcpTool).toHaveBeenCalledWith(
      'confidence-docs',
      'searchDocumentation',
      { query: 'React SDK install command' },
      expect.objectContaining({}),
    );
    expect(mockExecFile).toHaveBeenCalledWith(
      'npm',
      ['install', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: expect.any(String) }),
    );
  });

  it('uses detected package manager regardless of docs response', async () => {
    using _output = captureOutput();
    mockDetectPackageManager.mockReturnValue('pnpm');
    mockDetectFramework.mockResolvedValue(REACT_FRAMEWORK);
    mockCallMcpTool.mockResolvedValue('npm install @spotify-confidence/sdk');

    await run(['sdk', 'install']);

    expect(mockExecFile).toHaveBeenCalledWith(
      'pnpm',
      ['install', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: expect.any(String) }),
    );
  });

  it('falls back to framework sdkPackage when docs are unavailable', async () => {
    using _output = captureOutput();
    mockDetectPackageManager.mockReturnValue('pip');
    mockDetectFramework.mockResolvedValue(PYTHON_FRAMEWORK);
    mockCallMcpTool.mockRejectedValue(new Error('network error'));

    await run(['sdk', 'install']);

    expect(mockExecFile).toHaveBeenCalledWith(
      'pip',
      ['install', 'confidence-openfeature-provider'],
      expect.objectContaining({ cwd: expect.any(String) }),
    );
  });

  it('accepts --sdk to skip detection', async () => {
    using _output = captureOutput();
    mockDetectPackageManager.mockReturnValue('go');
    mockCallMcpTool.mockResolvedValue(
      'go get github.com/spotify/confidence-resolver/openfeature-provider/go',
    );

    await run(['sdk', 'install', '--sdk', 'go']);

    expect(mockDetectFramework).not.toHaveBeenCalled();
    expect(mockExecFile).toHaveBeenCalledWith(
      'go',
      ['get', 'github.com/spotify/confidence-resolver/openfeature-provider/go'],
      expect.objectContaining({ cwd: expect.any(String) }),
    );
  });

  it('prints manual instructions for gradle projects', async () => {
    using output = captureOutput();
    mockDetectPackageManager.mockReturnValue('gradle');
    mockDetectFramework.mockResolvedValue(KOTLIN_FRAMEWORK);

    await run(['sdk', 'install']);

    expect(output.stdout).toContain('build.gradle');
    expect(output.stdout).toContain(KOTLIN_FRAMEWORK.sdkPackage);
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it('reports error for unknown SDK id', async () => {
    using output = captureOutput();

    await run(['sdk', 'install', '--sdk', 'cobol']);

    expect(output.stderr).toContain('Unknown SDK: cobol');
  });

  it('reports error when framework cannot be detected', async () => {
    using output = captureOutput();
    mockDetectFramework.mockResolvedValue(null);

    await run(['sdk', 'install']);

    expect(output.stderr).toContain('Could not detect project framework');
  });

  it('reports error when no project is found', async () => {
    using output = captureOutput();
    mockDetectPackageManager.mockReturnValue(null);

    await run(['sdk', 'install']);

    expect(output.stderr).toContain('No project found');
  });
});
