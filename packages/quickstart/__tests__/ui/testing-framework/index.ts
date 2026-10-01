export { act, renderScreen, renderApp } from './ink/index.js';
export { createFakeChild, mockNextSpawn } from './mocks/index.js';
export { delay, waitFor } from './async.js';

export {
  KEY_MAP,
  resolveKey,
  type KeyName,
  type Modifiers,
  buildTestJwt,
  buildExpiredJwt,
  buildAuthState,
  prepareAuthTokens,
  createProjectDir,
  type ProjectType,
} from '@spotify-confidence/testing';

import { KEY_MAP } from '@spotify-confidence/testing';

/** @see {@link KEY_MAP.ArrowDown} */
export const ARROW_DOWN = KEY_MAP.ArrowDown;
/** @see {@link KEY_MAP.ArrowUp} */
export const ARROW_UP = KEY_MAP.ArrowUp;
/** @see {@link KEY_MAP.Enter} */
export const ENTER = KEY_MAP.Enter;
/** @see {@link KEY_MAP.Escape} */
export const ESCAPE = KEY_MAP.Escape;
/** @see {@link KEY_MAP.Space} */
export const SPACE = KEY_MAP.Space;
