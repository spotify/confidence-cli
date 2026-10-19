import { compose } from '@utils/compose.js';
import { withAuth } from '@utils/auth.js';
import { withDebug } from '@utils/debug.js';

export const withCrossCutting = compose(withAuth, withDebug);
