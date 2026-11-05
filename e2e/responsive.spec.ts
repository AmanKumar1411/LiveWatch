import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, 'page is wider than the viewport').toBeLessThanOrEqual(clientWidth);
}

test.describe('at 375px (small phone)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('f) no horizontal overflow on the watchlist or a coin page', async ({ page, market }) => {
    await page.goto('/');
    await market.sendSnapshot();
    await expect(page.getByText('$72,933.26')).toBeVisible();

    // Stacked cards: the column header row is hidden on phones.
    await expect(page.locator('thead')).toBeHidden();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('link', { name: /Bitcoin/ }).click();
    await expect(page.getByRole('img', { name: /Bitcoin price over the last 60 minutes/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
