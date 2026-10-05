export function captureOutput() {
  let stdout = '';
  let stderr = '';

  const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });

  const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    stderr += String(chunk);
    return true;
  });

  const prevExitCode = process.exitCode;

  return {
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
    [Symbol.dispose]() {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
      process.exitCode = prevExitCode;
    },
  };
}
