export { act, renderScreen, renderApp } from './ink/index.js';
export { createFakeChild, mockNextSpawn } from './mocks/index.js';
export { delay, waitFor } from './async.js';

export { KEY_MAP, resolveKey, type KeyName, type Modifiers } from '../../shared/key-map.js';
export {
  buildTestJwt,
  buildExpiredJwt,
  buildAuthState,
  prepareAuthTokens,
} from '../../shared/auth/index.js';
export { createProjectDir, type ProjectType } from '../../shared/project-scaffold/index.js';

import { KEY_MAP } from '../../shared/key-map.js';

/** @see {@link KEY_MAP.ArrowDown} */
export const ARROW_DOWN = KEY_MAP.ArrowDown;
/** @see {@link KEY_MAP.ArrowUp} */
export const ARROW_UP = KEY_MAP.ArrowUp;
/** @see {@link KEY_MAP.Enter} */
export const ENTER = KEY_MAP.Enter;
/** @see {@link KEY_MAP.Escape} */
export const ESCAPE = KEY_MAP.Escape;
