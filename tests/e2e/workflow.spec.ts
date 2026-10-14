import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function customer(page: Page) {
  await page.goto('/customer/');
  await page.getByRole('button', { name: 'Try as a customer' }).click();
  await expect(page.getByRole('heading', { name: 'Your requests', exact: true })).toBeVisible();
}
async function support(page: Page, manager = false) {
  await page.goto('/support/');
  await page
    .getByRole('button', { name: manager ? 'Try as a manager' : 'Try as an agent' })
    .click();
  await expect(page.getByRole('heading', { name: 'All requests', exact: true })).toBeVisible();
}
test('complete workflow across React and Angular, including private notes and manager reassignment', async ({
  page,
  context,
}) => {
  await customer(page);
  await page.getByRole('link', { name: 'Create a request', exact: true }).click();
  await page.getByLabel('Request title').fill('Invoice export fails in the billing dashboard');
  await page
    .getByLabel('What happened?')
    .fill(
      'The invoice PDF opens a blank page in two different browsers. Please investigate the export service.',
    );
  await page.getByLabel('Category', { exact: true }).selectOption('billing');
  await page.getByLabel('Urgency', { exact: true }).selectOption('high');
  await page.getByRole('button', { name: 'Send request', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Invoice export fails in the billing dashboard' }),
  ).toBeVisible();
  const id = page.url().split('/').at(-1)!;
  const agent = await context.newPage();
  await support(agent);
  await agent
    .getByRole('link', { name: 'Invoice export fails in the billing dashboard', exact: true })
    .click();
  await agent.getByRole('button', { name: 'Take this request', exact: true }).click();
  await expect(agent.getByRole('button', { name: 'Send message', exact: true })).toBeVisible();
  await agent
    .getByLabel('Reply to customer', { exact: true })
    .fill('I am investigating the invoice generation service.');
  await agent.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(
    agent.locator('.message-body').filter({ hasText: 'I am investigating' }),
  ).toBeVisible();
  await agent.getByRole('button', { name: 'Internal note', exact: true }).click();
  await agent
    .getByLabel('Internal note', { exact: true })
    .fill('PRIVATE DIAGNOSIS: billing worker queue is stalled.');
  await agent.getByRole('button', { name: 'Add note', exact: true }).click();
  await expect(
    agent.locator('.message-body').filter({ hasText: 'PRIVATE DIAGNOSIS' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator('.message-body').filter({ hasText: 'I am investigating' }),
  ).toBeVisible();
  await expect(page.getByText('PRIVATE DIAGNOSIS', { exact: false })).toHaveCount(0);
  await page
    .getByLabel('Send a reply', { exact: true })
    .fill('Thank you. The issue started this morning.');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('.message-body').filter({ hasText: 'Thank you.' })).toBeVisible();
  await agent.reload();
  await expect(agent.locator('.message-body').filter({ hasText: 'Thank you.' })).toBeVisible();
  await agent.getByRole('button', { name: 'Resolve request', exact: true }).click();
  await agent
    .getByLabel('Resolution', { exact: true })
    .fill('The billing queue was restarted and PDF downloads were verified.');
  await agent.getByRole('button', { name: 'Resolve request', exact: true }).last().click();
  await expect(agent.getByRole('heading', { name: 'This request is resolved.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'This request is resolved.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reopen request', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeVisible();
  const manager = await context.newPage();
  await support(manager, true);
  await manager.goto(`/support/#/requests/${id}`);
  await manager
    .getByLabel('Reassign request', { exact: true })
    .selectOption({ label: 'Youssef Adel' });
  await manager.getByRole('button', { name: 'Reassign request', exact: true }).click();
  await expect(
    manager.getByRole('status').filter({ hasText: 'Request reassigned.' }),
  ).toBeVisible();
  await agent.reload();
  await expect(agent.getByRole('button', { name: 'Send message', exact: true })).toHaveCount(0);
  await manager.getByRole('link', { name: 'Workload overview', exact: true }).click();
  await expect(manager.getByRole('heading', { name: 'Team workload', exact: true })).toBeVisible();
});
test('customer cannot open another customer request by URL', async ({ page }) => {
  await customer(page);
  await page.goto('/customer/#/requests/a0000000-0000-4000-8000-000000000008');
  await expect(page.getByRole('heading', { name: 'Request unavailable.' })).toBeVisible();
  await expect(
    page.getByText('Help connecting our new team workspace', { exact: true }),
  ).toHaveCount(0);
});
test('agent cannot enter manager route by changing URL', async ({ page }) => {
  await support(page);
  await expect(page.getByRole('link', { name: 'Workload overview', exact: true })).toHaveCount(0);
  await page.goto('/support/#/overview');
  await expect(page).toHaveURL(/#\/requests$/);
  await expect(page.getByRole('heading', { name: 'Team workload', exact: true })).toHaveCount(0);
});
test('search, empty state, filtering and pagination work without duplicates', async ({ page }) => {
  await support(page, true);
  await expect(page.locator('tbody tr')).toHaveCount(12);
  const first = await page.locator('tbody tr').first().innerText();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(6);
  expect(await page.locator('tbody').innerText()).not.toContain(first);
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search requests', exact: true })
    .fill('definitely-no-matching-request');
  await expect(page.getByRole('heading', { name: 'No matching requests.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(12);
  await page.getByRole('combobox', { name: 'Urgency', exact: true }).selectOption('urgent');
  await expect(page.locator('tbody tr')).toHaveCount(2);
});
test('stale mutations show an error and keep the message draft', async ({ page }) => {
  await support(page);
  await page
    .getByRole('link', { name: 'Unable to download my monthly invoice', exact: true })
    .click();
  await page
    .getByLabel('Reply to customer', { exact: true })
    .fill('This draft should survive a concurrency conflict.');
  await page.evaluate(() => {
    const key = 'wasl:demo:data:v1';
    const data = JSON.parse(localStorage.getItem(key)!);
    data.requests[0].version++;
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('This request changed');
  await expect(page.getByLabel('Reply to customer', { exact: true })).toHaveValue(
    'This draft should survive a concurrency conflict.',
  );
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(
    page.locator('.message-body').filter({ hasText: 'This draft should survive' }),
  ).toHaveCount(1);
});
test('both workspaces remain usable in Arabic on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await customer(page);
  await page.getByRole('button', { name: 'Switch to Arabic' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'طلباتك', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: test.info().outputPath('customer-arabic-mobile.png'),
    fullPage: true,
  });
  await page.goto('/support/');
  await page.getByRole('button', { name: 'جرّب كمدير' }).click();
  await expect(page.getByRole('heading', { name: 'كل الطلبات', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: test.info().outputPath('support-arabic-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'مساحة العمل', exact: true }).click();
  await page.getByRole('link', { name: 'نظرة على عبء العمل', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'عبء عمل الفريق', exact: true })).toBeVisible();
});
test('authentication initializes and protected routes are unavailable when signed out', async ({
  page,
}) => {
  await page.goto('/customer/#/new');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByLabel('Request title')).toHaveCount(0);
  await page.goto('/support/#/overview');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Team workload', exact: true })).toHaveCount(0);
});
test('customer and support lists pass automated WCAG AA checks', async ({ page }) => {
  await customer(page);
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  await support(page, true);
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
});
test('dialogs support keyboard dismissal and return focus', async ({ page }) => {
  await customer(page);
  const help = page.getByRole('button', { name: 'How to write a helpful request', exact: true });
  await help.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(help).toBeFocused();
});

test('mobile navigation traps focus and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await support(page, true);
  const menu = page.getByRole('button', { name: 'Workspace', exact: true });
  await menu.click();
  await expect(page.locator('.workspace-sidebar a').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.workspace-sidebar a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(page.locator('.workspace-sidebar')).not.toBeVisible();
});

test('detail, sign-in and manager report pass representative accessibility checks', async ({
  page,
}) => {
  await page.goto('/customer/');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Try as a customer' }).click();
  await page
    .getByRole('link', { name: 'Unable to download my monthly invoice', exact: true })
    .click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await support(page, true);
  await page.getByRole('link', { name: 'Workload overview', exact: true }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
