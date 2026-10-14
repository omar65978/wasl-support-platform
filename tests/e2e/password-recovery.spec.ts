import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const project = 'https://vbsrwnjyiskbjangbohb.supabase.co';
const user = {
  id: '10000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'recovery-test@example.com',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'Recovery Test' },
  created_at: '2026-01-01T00:00:00Z',
};
function accessToken() {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', role: 'authenticated', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })}.${Buffer.from('synthetic-test-signature').toString('base64url')}`;
}
function recoveryUrl(app: string) {
  return `/${app}/?auth=recovery#access_token=${accessToken()}&refresh_token=synthetic-refresh-token&type=recovery&expires_in=3600&token_type=bearer`;
}
async function mockAuth(
  page: Page,
  options: {
    expired?: boolean;
    rateLimited?: boolean;
    samePassword?: boolean;
    signOutError?: boolean;
  } = {},
) {
  const calls: {
    path: string;
    method: string;
    body: Record<string, unknown> | null;
    url: string;
  }[] = [];
  await page.route(`${project}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      });
      return;
    }
    const body = request.postData() ? request.postDataJSON() : null;
    calls.push({ path: url.pathname, method, body, url: url.href });
    let status = 200;
    let result: unknown = {};
    if (url.pathname.endsWith('/recover')) {
      if (options.rateLimited) {
        status = 429;
        result = { code: 'over_email_send_rate_limit', msg: 'Email rate limit exceeded' };
      }
    } else if (url.pathname.endsWith('/user')) {
      if (options.expired) {
        status = 401;
        result = { code: 'session_not_found', msg: 'Session expired' };
      } else if (method === 'PUT' && options.samePassword) {
        status = 422;
        result = {
          code: 'same_password',
          msg: 'New password should be different from the old password.',
        };
      } else result = user;
    } else if (url.pathname.endsWith('/logout')) {
      status = options.signOutError ? 500 : 204;
      result = { msg: 'Unable to sign out' };
    } else if (url.pathname.endsWith('/token')) {
      result = {
        access_token: accessToken(),
        refresh_token: 'synthetic-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      };
    } else if (url.pathname.startsWith('/rest/')) {
      status = 406;
      result = { code: 'PGRST116', message: 'No profile rows' };
    } else {
      status = 400;
      result = { msg: 'Unexpected mocked endpoint' };
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 204 ? '' : JSON.stringify(result),
    });
  });
  return calls;
}

for (const app of ['customer', 'support']) {
  test(`${app}: requests a reset with a private confirmation and the correct callback`, async ({
    page,
  }) => {
    const calls = await mockAuth(page);
    await page.goto(`/${app}/`);
    await page.getByRole('button', { name: 'Forgot password?', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Let’s get you back in.' })).toBeVisible();
    await expect(page.locator('.demo-options')).toHaveCount(0);
    await page.getByLabel('Email address').fill('unknown@example.com');
    await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('If an account exists for this email');
    const request = calls.find((call) => call.path.endsWith('/recover'))!;
    expect(request.body?.email).toBe('unknown@example.com');
    expect(new URL(request.url).searchParams.get('redirect_to')).toBe(
      `http://localhost:4173/${app}/?auth=recovery`,
    );
    await expect(page.getByRole('button', { name: 'Send reset link', exact: true })).toBeDisabled();
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
    ).toEqual([]);
    await page.getByRole('button', { name: 'Back to sign in', exact: true }).click();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  });
  test(`${app}: recovers a missing-profile account without fetching its profile or entering the demo`, async ({
    page,
  }) => {
    const calls = await mockAuth(page);
    await page.addInitScript(() => {
      sessionStorage.setItem('wasl:demo:customer', 'customer');
      sessionStorage.setItem('wasl:demo:support', 'manager');
    });
    await page.goto(recoveryUrl(app));
    await expect(page.getByRole('heading', { name: 'Choose a new password.' })).toBeVisible();
    expect(page.url()).not.toContain('access_token');
    expect(page.url()).not.toContain('refresh_token');
    await expect(page.locator('.demo-banner')).toHaveCount(0);
    expect(calls.some((call) => call.path.startsWith('/rest/'))).toBe(false);
    expect(await page.evaluate(() => sessionStorage.getItem('wasl:demo:customer'))).toBeNull();
    await page.getByLabel('New password', { exact: true }).fill('New-testing-password-2026!');
    await page
      .getByLabel('Confirm new password', { exact: true })
      .fill('Different-testing-password!');
    await page.getByRole('button', { name: 'Save new password', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('The passwords do not match.');
    expect(calls.filter((call) => call.method === 'PUT')).toHaveLength(0);
    await page
      .getByLabel('Confirm new password', { exact: true })
      .fill('New-testing-password-2026!');
    await page.getByRole('button', { name: 'Save new password', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Password updated.', exact: true }),
    ).toBeVisible();
    expect(calls.filter((call) => call.method === 'PUT').map((call) => call.body)).toMatchObject([
      { password: 'New-testing-password-2026!' },
    ]);
    await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0);
    await page.evaluate(() => {
      sessionStorage.removeItem('wasl:demo:customer');
      sessionStorage.removeItem('wasl:demo:support');
    });
    await page.context().clearCookies();
    await page.getByRole('button', { name: 'Back to sign in', exact: true }).click();
    await expect(page).not.toHaveURL(/auth=recovery/);
    expect(
      calls.some(
        (call) =>
          call.path.endsWith('/logout') && new URL(call.url).searchParams.get('scope') === 'global',
      ),
    ).toBe(true);
  });
  test(`${app}: expired and missing links cannot open the password form`, async ({ page }) => {
    const calls = await mockAuth(page, { expired: true });
    await page.goto(recoveryUrl(app));
    await expect(page.getByRole('alert')).toContainText('This reset link is invalid');
    await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0);
    await page.goto(`/${app}/?auth=recovery`);
    await expect(page.getByRole('alert')).toContainText('This reset link is invalid');
    await expect(page.getByRole('button', { name: 'Send reset link', exact: true })).toBeVisible();
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
  });
  test(`${app}: rate-limit errors do not display a sent confirmation`, async ({ page }) => {
    await mockAuth(page, { rateLimited: true });
    await page.goto(`/${app}/`);
    await page.getByRole('button', { name: 'Forgot password?', exact: true }).click();
    await page.getByLabel('Email address').fill('recovery-test@example.com');
    await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Too many');
    await expect(page.getByRole('status')).toHaveCount(0);
  });
  test(`${app}: recovery supports Arabic, mobile layouts, and dark mode`, async ({ page }) => {
    await mockAuth(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('wasl:language', 'ar');
      localStorage.setItem('wasl:theme', 'dark');
    });
    await page.goto(recoveryUrl(app));
    await expect(page.getByRole('heading', { name: 'اختر كلمة مرور جديدة.' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `docs/screenshots/${app}-password-recovery-arabic.png`,
      fullPage: true,
    });
  });
  test(`${app}: updated demo notice follows the selected language`, async ({ page }) => {
    await mockAuth(page);
    await page.goto(`/${app}/`);
    await page
      .getByRole('button', {
        name: app === 'customer' ? 'Try as a customer' : 'Try as an agent',
        exact: true,
      })
      .click();
    await expect(page.locator('.demo-banner')).toContainText(
      'Demo workspace. Sample data stays in this browser; nothing is sent to the database.',
    );
    await page.getByRole('button', { name: 'Switch to Arabic', exact: true }).click();
    await expect(page.locator('.demo-banner')).toContainText(
      'مساحة تجريبية. تُحفظ البيانات في هذا المتصفح فقط ولا تُرسل إلى قاعدة البيانات.',
    );
  });
}

test('customer: missing profiles receive a specific sign-in error', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/customer/');
  await page.getByLabel('Email address').fill('recovery-test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Some-testing-password!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('its application profile is missing');
});
