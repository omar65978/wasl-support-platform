import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorKey, translate } from '../packages/shared/src/i18n';

const mock = vi.hoisted(() => ({
  auth: {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    setSession: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    signInWithPassword: vi.fn(),
  },
  from: vi.fn(),
}));
vi.mock('../packages/shared/src/client', () => ({ supabase: mock }));

const origin = 'https://wasl-support-platform-v2.vercel.app';
const callback = `${origin}/customer/?auth=recovery#access_token=test-access&refresh_token=test-refresh&type=recovery`;
let storage: Map<string, string>;
let replace: ReturnType<typeof vi.fn>;
let replaceState: ReturnType<typeof vi.fn>;
function location(href: string) {
  const url = new URL(href);
  vi.stubGlobal('window', {
    location: {
      href,
      origin: url.origin,
      port: url.port,
      protocol: url.protocol,
      hostname: url.hostname,
      replace,
    },
    history: { state: null, replaceState },
  });
}
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  storage = new Map();
  replace = vi.fn();
  replaceState = vi.fn();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  location(`${origin}/customer/`);
  mock.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  mock.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mock.auth.setSession.mockResolvedValue({
    data: { session: { access_token: 'verified' }, user: { id: 'user' } },
    error: null,
  });
  mock.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  mock.auth.updateUser.mockResolvedValue({ data: { user: { id: 'user' } }, error: null });
  mock.auth.signOut.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllGlobals());
async function controller(recovery = false, app: 'customer' | 'support' = 'customer') {
  if (recovery) location(callback.replace('/customer/', `/${app}/`));
  const { AuthController } = await import('../packages/shared/src/auth');
  const auth = new AuthController(app);
  await auth.init();
  return auth;
}

describe('recovery callback parsing', () => {
  it('removes credentials from the address before application routing and consumes them once', async () => {
    location(callback);
    const recovery = await import('../packages/shared/src/recovery');
    expect(recovery.isRecoveryCallback).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(null, '', '/customer/?auth=recovery');
    expect(recovery.takeRecoveryTokens()).toEqual({
      access_token: 'test-access',
      refresh_token: 'test-refresh',
    });
    expect(recovery.takeRecoveryTokens()).toBeNull();
  });
  it('recognizes recovery tokens even when a customized redirect omitted the query marker', async () => {
    const { parseRecoveryUrl } = await import('../packages/shared/src/recovery');
    expect(parseRecoveryUrl(callback.replace('?auth=recovery', '')).active).toBe(true);
  });
  it('does not intercept ordinary sign-in or sign-up links', async () => {
    const { parseRecoveryUrl } = await import('../packages/shared/src/recovery');
    expect(parseRecoveryUrl(`${origin}/customer/#/requests/123`).active).toBe(false);
    expect(
      parseRecoveryUrl(
        callback.replace('?auth=recovery', '').replace('type=recovery', 'type=signup'),
      ).active,
    ).toBe(false);
    expect(replaceState).not.toHaveBeenCalled();
  });
  it('rejects missing credentials, wrong link types, and error callbacks', async () => {
    const { parseRecoveryUrl } = await import('../packages/shared/src/recovery');
    for (const href of [
      `${origin}/customer/?auth=recovery`,
      callback.replace('refresh_token=test-refresh&', ''),
      callback.replace('type=recovery', 'type=signup'),
      callback + '&error_code=otp_expired',
      callback.replace('?auth=recovery', '?auth=recovery&error_code=otp_expired'),
    ]) {
      expect(parseRecoveryUrl(href).active).toBe(true);
      expect(parseRecoveryUrl(href).tokens).toBeNull();
    }
  });
});

describe('password recovery controller', () => {
  it.each(['customer', 'support'] as const)(
    'requests recovery for %s using the actual origin and application',
    async (app) => {
      const auth = await controller(false, app);
      await auth.requestPasswordReset('  account@example.com  ');
      expect(mock.auth.resetPasswordForEmail).toHaveBeenCalledWith('account@example.com', {
        redirectTo: `${origin}/${app}/?auth=recovery`,
      });
    },
  );
  it('rejects invalid email before any request', async () => {
    const auth = await controller();
    await expect(auth.requestPasswordReset('not-an-email')).rejects.toThrow('INVALID_EMAIL');
    expect(mock.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it('surfaces rate limits without converting a failed send to success', async () => {
    const auth = await controller();
    const error = { status: 429, code: 'over_email_send_rate_limit' };
    mock.auth.resetPasswordForEmail.mockResolvedValue({ error });
    await expect(auth.requestPasswordReset('account@example.com')).rejects.toEqual(error);
    expect(errorKey(error)).toBe('errorRate');
  });
  it('validates recovery using Auth without needing a profiles row and exits demo mode', async () => {
    storage.set('wasl:demo:customer', 'customer');
    storage.set('wasl:demo:support', 'manager');
    const auth = await controller(true);
    expect(auth.getSnapshot()).toMatchObject({
      recovery: 'ready',
      profile: null,
      demo: false,
      loading: false,
    });
    expect(mock.auth.setSession).toHaveBeenCalledWith({
      access_token: 'test-access',
      refresh_token: 'test-refresh',
    });
    expect(mock.from).not.toHaveBeenCalled();
    expect(storage.size).toBe(0);
    auth.enterDemo('manager');
    expect(auth.getSnapshot().demo).toBe(false);
  });
  it('does not reuse an existing signed-in session for a missing recovery link', async () => {
    location(`${origin}/customer/?auth=recovery`);
    const auth = await controller();
    expect(auth.getSnapshot().recovery).toBe('invalid');
    expect(mock.auth.setSession).not.toHaveBeenCalled();
    expect(mock.auth.getSession).not.toHaveBeenCalled();
    await expect(
      auth.updatePassword('a-valid-new-password', 'a-valid-new-password'),
    ).rejects.toThrow('RECOVERY_INVALID');
  });
  it('blocks updates outside recovery and rejects expired sessions', async () => {
    mock.auth.setSession.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('Expired'),
    });
    const auth = await controller(true);
    expect(auth.getSnapshot().recovery).toBe('invalid');
    await expect(
      auth.updatePassword('a-valid-new-password', 'a-valid-new-password'),
    ).rejects.toThrow('RECOVERY_INVALID');
    expect(mock.auth.updateUser).not.toHaveBeenCalled();
  });
  it('requires matching passwords of at least twelve characters', async () => {
    const auth = await controller(true);
    await expect(auth.updatePassword('short', 'short')).rejects.toThrow('INVALID_PASSWORD');
    await expect(
      auth.updatePassword('a-valid-new-password', 'different-new-password'),
    ).rejects.toThrow('PASSWORD_MISMATCH');
    expect(mock.auth.updateUser).not.toHaveBeenCalled();
  });
  it('saves only the password, preserves profile data, and ends in a completion state', async () => {
    const auth = await controller(true);
    await auth.updatePassword('a-valid-new-password', 'a-valid-new-password');
    expect(mock.auth.updateUser).toHaveBeenCalledWith({ password: 'a-valid-new-password' });
    expect(mock.from).not.toHaveBeenCalled();
    expect(auth.getSnapshot().recovery).toBe('complete');
    await expect(
      auth.updatePassword('a-valid-new-password', 'a-valid-new-password'),
    ).rejects.toThrow('RECOVERY_INVALID');
    await auth.leaveRecovery();
    expect(mock.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
    expect(replace).toHaveBeenCalledWith(`${origin}/customer/`);
  });
  it('keeps recovery available when Supabase rejects reuse of the old password', async () => {
    const auth = await controller(true);
    const error = { code: 'same_password', message: 'New password should be different' };
    mock.auth.updateUser.mockResolvedValue({ error });
    await expect(
      auth.updatePassword('a-valid-new-password', 'a-valid-new-password'),
    ).rejects.toEqual(error);
    expect(auth.getSnapshot().recovery).toBe('ready');
    expect(errorKey(error)).toBe('errorSamePassword');
  });
  it('returns an expired session to the new-link screen', async () => {
    const auth = await controller(true);
    mock.auth.updateUser.mockResolvedValue({ error: { status: 401, code: 'session_not_found' } });
    await expect(
      auth.updatePassword('a-valid-new-password', 'a-valid-new-password'),
    ).rejects.toThrow('RECOVERY_INVALID');
    expect(auth.getSnapshot().recovery).toBe('invalid');
  });
  it('does not silently redirect when post-recovery sign-out fails', async () => {
    const auth = await controller(true);
    await auth.updatePassword('a-valid-new-password', 'a-valid-new-password');
    mock.auth.signOut.mockResolvedValue({ error: new Error('Network unavailable') });
    await expect(auth.leaveRecovery()).rejects.toThrow('RECOVERY_SIGNOUT_FAILED');
    expect(auth.getSnapshot().recovery).toBe('complete');
    expect(replace).not.toHaveBeenCalled();
  });
  it('does not consume a callback twice when initialization is repeated', async () => {
    const auth = await controller(true);
    await auth.init();
    expect(mock.auth.setSession).toHaveBeenCalledTimes(1);
    expect(auth.getSnapshot().recovery).toBe('ready');
  });
});

it('uses the requested demo notice in both languages', () => {
  expect(translate('en', 'demoNotice')).toBe(
    'Demo workspace. Sample data stays in this browser; nothing is sent to the database.',
  );
  expect(translate('ar', 'demoNotice')).toBe(
    'مساحة تجريبية. تُحفظ البيانات في هذا المتصفح فقط ولا تُرسل إلى قاعدة البيانات.',
  );
});
