export type RecoveryState = 'none' | 'verifying' | 'ready' | 'invalid' | 'complete';
export interface RecoveryTokens {
  access_token: string;
  refresh_token: string;
}
export function parseRecoveryUrl(href: string) {
  const url = new URL(href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const active = url.searchParams.get('auth') === 'recovery' || fragment.get('type') === 'recovery';
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');
  const tokens: RecoveryTokens | null =
    active &&
    fragment.get('type') === 'recovery' &&
    !fragment.has('error') &&
    !fragment.has('error_code') &&
    !url.searchParams.has('error') &&
    !url.searchParams.has('error_code') &&
    accessToken &&
    refreshToken
      ? { access_token: accessToken, refresh_token: refreshToken }
      : null;
  if (active) {
    url.hash = '';
    url.searchParams.set('auth', 'recovery');
    for (const key of ['error', 'error_code', 'error_description']) url.searchParams.delete(key);
  }
  return { active, tokens, cleanUrl: url.pathname + url.search };
}
const callback =
  typeof window === 'undefined'
    ? { active: false, tokens: null, cleanUrl: '' }
    : parseRecoveryUrl(window.location.href);
export const isRecoveryCallback = callback.active;
if (isRecoveryCallback) window.history.replaceState(window.history.state, '', callback.cleanUrl);
export function takeRecoveryTokens(): RecoveryTokens | null {
  const tokens = callback.tokens;
  callback.tokens = null;
  return tokens;
}
