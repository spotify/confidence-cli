export const isWindows = process.platform === 'win32';

export function perPlatform<T>(options: { windows: T; unix: T }): T {
  return isWindows ? options.windows : options.unix;
}
