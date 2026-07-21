// In-memory localStorage for vitest forks.
// Node.js warns when code accesses localStorage without --localstorage-file.
// MSW reads localStorage at import time for its CookieStore.
// A file-backed store causes SQLite locking under concurrent forks,
// so each fork gets its own in-memory implementation instead.

const store = new Map();

globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (index) => [...store.keys()][index] ?? null,
};
