import { expect, test } from './fixtures';

test('e) a dropped socket shows the reconnecting banner, then recovers', async ({ page, market }) => {
  await page.goto('/');
  await market.sendSnapshot();
  await expect(page.getByRole('status', { name: 'Market data: Live' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);

  await market.closeSocket();

  await expect(page.getByRole('alert')).toHaveText('Can’t reach market data. Retrying…');
  await expect(page.getByRole('status', { name: 'Market data: Reconnecting' })).toBeVisible();
  // Prices already on screen stay visible while we reconnect.
  await expect(page.getByRole('row', { name: /Bitcoin/ })).toContainText('$72,933.26');

  // First retry fires after ~1s (+ jitter); the mock accepts the new connection.
  await market.waitForConnection(2);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('status', { name: 'Market data: Live' })).toBeVisible();
});
