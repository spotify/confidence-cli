import { env } from '../../system/env.js';

const AUTH_DOMAIN = env('CONFIDENCE_AUTH_DOMAIN', 'auth.confidence.dev');

export const AUTH_BASE_URL = env('CONFIDENCE_AUTH_URL', `https://${AUTH_DOMAIN}`);
export const AUTH_AUDIENCE = 'https://confidence.dev/';
export const AUTH_SCOPE = 'openid profile email offline_access';
export const AUTH_CLIENT_ID_SIGNUP = '82qMvwZvqd3t3S0gRDvs8R53TehQXSJY';
export const AUTH_CLIENT_ID_LOGIN = '2fG3H4RhlAbIZm9Rfn32zTaILH7w1X4w';
export const AUTH_CALLBACK_PORT = 8084;
