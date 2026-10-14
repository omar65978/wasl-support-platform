import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('theme can be changed before sign-in and persists across reloads and both applications', async ({
  page,
  context,
}) => {
  await page.goto('/customer/');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  const support = await context.newPage();
  await support.goto('/support/');
  await expect(support.locator('html')).toHaveAttribute('data-theme', 'dark');
  await support.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(support.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('system appearance is applied before the application bundle loads', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.route('**/*.js', (route) =>
    new URL(route.request().url()).pathname.endsWith('theme-init.js')
      ? route.continue()
      : route.abort(),
  );
  for (const app of ['customer', 'support']) {
    await page.goto(`/${app}/`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  }
});
test('system preference follows changes until the user explicitly chooses a theme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/customer/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('changing appearance preserves customer drafts and works on Arabic mobile screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/customer/');
  await page.getByRole('button', { name: 'Try as a customer' }).click();
  await page.getByRole('link', { name: 'Create a request', exact: true }).click();
  await page
    .getByLabel('Request title', { exact: true })
    .fill('My draft must survive a theme change');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.getByLabel('Request title', { exact: true })).toHaveValue(
    'My draft must survive a theme change',
  );
  await page.getByRole('button', { name: 'Switch to Arabic' }).click();
  await expect(page.getByRole('button', { name: 'التبديل إلى الوضع الفاتح' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/support/');
  await page.getByRole('button', { name: 'جرّب كمدير' }).click();
  await expect(page.getByRole('heading', { name: 'كل الطلبات', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'التبديل إلى الوضع الفاتح' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('dark authentication, lists, forms, conversations, and manager reports pass automated AA checks', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ colorScheme: 'dark' });
  const audit = async () =>
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  await page.goto('/customer/');
  await audit();
  await page.getByRole('button', { name: 'Try as a customer' }).click();
  await audit();
  await page.getByRole('link', { name: 'Create a request', exact: true }).click();
  await audit();
  await page.goto('/customer/#/requests/a0000000-0000-4000-8000-000000000001');
  await expect(page.getByRole('heading', { name: 'Conversation', exact: true })).toBeVisible();
  await audit();
  await page.goto('/support/');
  await audit();
  await page.getByRole('button', { name: 'Try as a manager' }).click();
  await audit();
  await page
    .getByRole('link', { name: 'Unable to download my monthly invoice', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Conversation', exact: true })).toBeVisible();
  await audit();
  await page.getByRole('link', { name: 'Workload overview', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Team workload', exact: true })).toBeVisible();
  await audit();
});
