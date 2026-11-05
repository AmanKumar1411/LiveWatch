import { expect, makeKlines, test } from './fixtures';

test.describe('coin page', () => {
  test('d) clicking a row opens the detail page with live stats and a chart', async ({ page, market }) => {
    await page.goto('/');
    await market.sendSnapshot();

    // Click the price cell, not the name link, to exercise the row's own click handler.
    await page.getByRole('row', { name: /Ethereum/ }).getByRole('cell').nth(1).click();

    await expect(page).toHaveURL(/\/coin\/ETHUSDT$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ethereum');
    await expect(page.getByTestId('live-price')).toHaveText('$2,021.11');
    await expect(page.getByRole('img', { name: /Ethereum price over the last 60 minutes/ })).toBeVisible();

    // Live trades keep updating the detail page too.
    market.sendTrade('ETHUSDT', 2030.5);
    await expect(page.getByTestId('live-price')).toHaveText('$2,030.50');

    await page.getByRole('button', { name: /Back to watchlist/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('row', { name: /Ethereum/ })).toBeVisible();
  });

  test('price history shows an error state with a working Retry', async ({ page }) => {
    let fail = true;
    // Registered after the fixture's mock, so it takes precedence.
    await page.route(/\/api\/v3\/klines/, async (route) => {
      if (fail) await route.fulfill({ status: 500, body: 'server error' });
      else await route.fulfill({ json: makeKlines('BTCUSDT') });
    });

    await page.goto('/coin/BTCUSDT');
    await expect(page.getByText('Couldn’t load price history')).toBeVisible();

    fail = false;
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('img', { name: /Bitcoin price over the last 60 minutes/ })).toBeVisible();
  });
});
