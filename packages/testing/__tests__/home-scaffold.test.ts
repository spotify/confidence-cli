import { homedir } from 'node:os';
import { describe, it, expect } from 'vitest';
import { isolateHome } from '../src/scaffold/home-scaffold.js';

describe('isolateHome', () => {
  it('stubs both HOME and USERPROFILE to isolate os.homedir() across platforms', () => {
    const fakeDir = process.platform === 'win32' ? 'C:\\fake\\home' : '/fake/home';
    {
      using _home = isolateHome(fakeDir);
      expect(process.env.HOME).toBe(fakeDir);
      expect(process.env.USERPROFILE).toBe(fakeDir);
      expect(homedir()).toBe(fakeDir);
    }
  });

  it('restores previous environment when disposed', () => {
    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    {
      using _home = isolateHome('/temporary/test/dir');
      expect(process.env.HOME).toBe('/temporary/test/dir');
    }
    expect(process.env.HOME).toBe(origHome);
    expect(process.env.USERPROFILE).toBe(origUserProfile);
  });
});
