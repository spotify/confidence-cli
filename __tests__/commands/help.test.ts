import { helpCommand } from '@commands/help.js';

describe('helpCommand', () => {
  it('has correct metadata', () => {
    const sut = helpCommand;
    expect(sut.name).toBe('help');
    expect(sut.description).toBe('Show help information');
    expect(sut.aliases).toContain('h');
  });

  it('prints help text to console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const sut = helpCommand;

    sut.handler({} as never);

    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('confidence-wizard');
    expect(output).toContain('confidence.spotify.com');
    spy.mockRestore();
  });
});
