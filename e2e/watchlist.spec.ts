import { coinRows, expect, test } from './fixtures';

test.describe('watchlist', () => {
  test('a) shows skeleton rows until the first prices arrive, then live prices', async ({ page, market }) => {
    await page.goto('/');

    // No socket data yet → placeholders, and the table reports itself busy.
    await expect(page.getByTestId('skeleton').first()).toBeVisible();
    await expect(page.getByRole('table')).toHaveAttribute('aria-busy', 'true');

    await market.sendSnapshot();
    const btc = page.getByRole('row', { name: /Bitcoin/ });
    await expect(btc).toContainText('$72,933.26');
    await expect(page.getByTestId('skeleton')).toHaveCount(0);
    await expect(page.getByRole('table')).toHaveAttribute('aria-busy', 'false');

    // A trade moves the price up: it renders after the next flush, flashing green.
    market.sendTrade('BTCUSDT', 73001.5);
    await expect(btc).toContainText('$73,001.50');
    await expect(btc.locator('.flash-up')).toBeVisible();
  });

  test('b) search filters by symbol or name and shows an empty state', async ({ page, market }) => {
    await page.goto('/');
    await market.sendSnapshot();
    const search = page.getByRole('searchbox', { name: 'Search coins' });
    await expect(coinRows(page)).toHaveCount(8);

    await search.fill('sol'); // symbol
    await expect(coinRows(page)).toHaveCount(1);
    await expect(coinRows(page)).toContainText('Solana');

    await search.fill('ether'); // name, case-insensitive
    await expect(coinRows(page)).toHaveCount(1);
    await expect(coinRows(page)).toContainText('Ethereum');

    await search.fill('zzz');
    await expect(page.getByText('No coins match your search')).toBeVisible();
    await expect(coinRows(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(search).toHaveValue('');
    await expect(coinRows(page)).toHaveCount(8);
  });

  test('c) a starred coin appears under Starred and survives a reload', async ({ page, market }) => {
    await page.goto('/');
    await market.sendSnapshot();
    const starredTab = page.getByRole('tab', { name: /Starred/ });

    await starredTab.click();
    await expect(page.getByText('Star a coin to see it here')).toBeVisible();
    await page.getByRole('tab', { name: /All/ }).click();

    await page.getByRole('button', { name: 'Star Solana' }).click();
    await expect(page.getByRole('button', { name: 'Star Solana' })).toHaveAttribute('aria-pressed', 'true');
    await starredTab.click();
    await expect(coinRows(page)).toHaveCount(1);
    await expect(coinRows(page)).toContainText('Solana');

    await page.reload();
    await market.waitForConnection(2);
    await market.sendSnapshot();
    await page.getByRole('tab', { name: /Starred/ }).click();
    await expect(coinRows(page)).toHaveCount(1);
    await expect(coinRows(page)).toContainText('Solana');
    await expect(page.getByRole('button', { name: 'Star Solana' })).toHaveAttribute('aria-pressed', 'true');
  });
});
