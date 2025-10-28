import { env } from '@/env';

export const LOGOUT_URL = new URL('/api/auth/logout', env.nextauthUrl);
export const LOGOUT_CALLBACK_URL = new URL('/api/auth/logout-callback', env.nextauthUrl);
