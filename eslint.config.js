import base from '@spotify-confidence/eslint-config';

export default [...base, { ignores: ['dist/', 'node_modules/', 'packages/'] }];
