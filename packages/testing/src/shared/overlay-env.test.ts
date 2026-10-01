import { overlayEnv } from './overlay-env.js';

describe('overlayEnv', () => {
  it('replaces Windows Path with PATH so mock bins win', () => {
    const sut = overlayEnv(
      { Path: 'C:\\Windows', HOME: '/old' },
      { PATH: 'C:\\mock\\bin', HOME: '/tmp/e2e' },
    );

    expect(sut.PATH).toBe('C:\\mock\\bin');
    expect(sut.Path).toBeUndefined();
    expect(sut.HOME).toBe('/tmp/e2e');
  });

  it('replaces Temp and Tmp when TEMP and TMP are set', () => {
    const sut = overlayEnv(
      { Temp: 'C:\\Windows\\Temp', Tmp: 'C:\\Windows\\Temp' },
      { TEMP: 'D:\\e2e', TMP: 'D:\\e2e' },
    );

    expect(sut.TEMP).toBe('D:\\e2e');
    expect(sut.TMP).toBe('D:\\e2e');
    expect(sut.Temp).toBeUndefined();
    expect(sut.Tmp).toBeUndefined();
  });
});
