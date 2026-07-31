const ESC = '\x1b';

/**
 * Maps human-readable key names to their terminal escape sequences.
 *
 * Key names follow the DOM {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key KeyboardEvent.key}
 * convention so they feel familiar to web developers.
 *
 * @example
 * ```ts
 * KEY_MAP.Enter    // '\r'
 * KEY_MAP.ArrowDown // '\x1b[B'
 * ```
 */
const KEY_MAP = {
  Enter: '\r',
  ArrowDown: `${ESC}[B`,
  ArrowUp: `${ESC}[A`,
  ArrowLeft: `${ESC}[D`,
  ArrowRight: `${ESC}[C`,
  Escape: ESC,
  Backspace: '\x7f',
  Tab: '\t',
  Delete: `${ESC}[3~`,
  Home: `${ESC}[H`,
  End: `${ESC}[F`,
  Space: ' ',
} as const;

/** A key name recognized by {@link KEY_MAP}. */
type KeyName = keyof typeof KEY_MAP;

/**
 * Optional keyboard modifiers applied when resolving a key.
 *
 * Only meaningful for single-character keys — named keys like `'ArrowDown'`
 * have no distinct modified escape sequence in xterm.
 *
 * @see {@link resolveKey}
 */
type Modifiers = {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
};

/**
 * Resolves a key name (or single character) into the raw escape sequence
 * that the terminal expects, optionally applying modifier keys.
 *
 * Named keys are looked up in {@link KEY_MAP}. Single characters pass through
 * as-is. Multi-character strings not in the map throw to catch typos like
 * `'enter'` (should be `'Enter'`).
 *
 * @param key - A {@link KeyName} or a single character (e.g. `'a'`).
 * @param modifiers - Optional {@link Modifiers} (`ctrl`, `alt`, `shift`).
 * @returns The raw bytes to write to the PTY.
 * @throws {Error} If `key` is a multi-character string not in {@link KEY_MAP}.
 *
 * @example
 * ```ts
 * resolveKey('Enter')                   // '\r'
 * resolveKey('c', { ctrl: true })       // '\x03'  (SIGINT)
 * resolveKey('x', { alt: true })        // '\x1bx' (ESC-prefixed)
 * ```
 */
function resolveKey(key: string, modifiers?: Modifiers): string {
  const mapped = KEY_MAP[key as KeyName] as string | undefined;

  if (!mapped && key.length > 1) {
    throw new Error(
      `Unknown key name: "${key}". Use a named key (${Object.keys(KEY_MAP).join(', ')}) or a single character.`,
    );
  }

  const base = mapped ?? key;

  if (modifiers?.ctrl && base.length === 1) {
    const code = base.toLowerCase().charCodeAt(0) - 96;
    if (code >= 1 && code <= 26) {
      return String.fromCharCode(code);
    }
  }

  if (modifiers?.alt && base.length === 1) {
    return `${ESC}${base}`;
  }

  return base;
}

export { KEY_MAP, resolveKey };
export type { KeyName, Modifiers };
