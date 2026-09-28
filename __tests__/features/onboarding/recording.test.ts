import { basename, resolve } from 'node:path';
import { projectDisplayName, projectParentName } from '@features/onboarding/sections/recording.js';

describe('projectDisplayName', () => {
  it('uses the last segment of an absolute project dir', () => {
    const sut = projectDisplayName('/tmp/checkout-web');
    expect(sut).toBe('checkout-web');
  });

  it('resolves a relative project dir instead of using "." as the client name', () => {
    const sut = projectDisplayName('.');

    expect(sut).toBe(basename(resolve('.')));
    expect(sut).not.toBe('.');
  });

  it('resolves ".." to the parent folder name', () => {
    const sut = projectDisplayName('..');

    expect(sut).toBe(basename(resolve('..')));
    expect(sut).not.toBe('..');
  });

  it('falls back to "project" when the resolved path has no basename', () => {
    expect(projectDisplayName('/')).toBe('project');
  });
});

describe('projectParentName', () => {
  it('uses the parent folder of the resolved project dir', () => {
    const sut = projectParentName('/tmp/checkout-web');
    expect(sut).toBe('tmp');
  });
});
