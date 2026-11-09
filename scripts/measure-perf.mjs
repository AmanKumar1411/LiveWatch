/**
 * Measures socket messages/sec vs React renders/sec on LIVE Binance data, with and without
 * batching and React.memo.
 *
 *   npm run perf                      # builds with VITE_PERF=true into dist-perf, then runs this
 *   PERF_SECONDS=120 npm run perf     # longer sample window
 *
 * All four modes run in parallel (one browser context each), so they see the same market
 * activity. Counts come from the app's own perf counters (src/dev/perf.ts), sampled every
 * second. Main-thread busy time comes from Chrome DevTools Protocol `Performance.getMetrics`
 * (TaskDuration).
 */
import os from 'node:os';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const SECONDS = Number(process.env.PERF_SECONDS ?? 60);
const WARMUP_MS = 5_000;
const PORT = 4174;

const MODES = [
  { name: 'Batching + memo (shipped)', query: '' },
  { name: 'No batching, memo', query: '?batch=0' },
  { name: 'Batching, no memo', query: '?memo=0' },
  { name: 'No batching, no memo', query: '?batch=0&memo=0' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function taskSeconds(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return metrics.find((m) => m.name === 'TaskDuration')?.value ?? 0;
}

const server = await preview({
  build: { outDir: 'dist-perf' },
  preview: { port: PORT, strictPort: true },
  logLevel: 'warn',
});
const browser = await chromium.launch();

try {
  const runs = await Promise.all(
    MODES.map(async (mode) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Performance.enable');
      await page.goto(`http://localhost:${PORT}/${mode.query}`);
      // Wait for live data in every row.
      await page.waitForFunction(
        () => document.querySelectorAll('tbody tr').length === 8 && !document.querySelector('[data-testid="skeleton"]'),
        null,
        { timeout: 30_000 },
      );
      return { mode, page, cdp };
    }),
  );

  console.log(`Warming up ${WARMUP_MS / 1000}s, then sampling ${SECONDS}s of live data…`);
  await sleep(WARMUP_MS);

  const starts = await Promise.all(
    runs.map(async ({ page, cdp }) => ({
      index: await page.evaluate(() => window.__livewatchPerf?.length ?? 0),
      task: await taskSeconds(cdp),
      at: Date.now(),
    })),
  );

  await sleep(SECONDS * 1000);

  const rows = await Promise.all(
    runs.map(async ({ mode, page, cdp }, i) => {
      const start = starts[i];
      const samples = await page.evaluate((from) => window.__livewatchPerf.slice(from), start.index);
      const elapsed = (Date.now() - start.at) / 1000;
      const task = await taskSeconds(cdp);
      const visibility = await page.evaluate(() => document.visibilityState);
      const avg = (key) => samples.reduce((sum, s) => sum + s[key], 0) / samples.length;
      const peak = (key) => Math.max(...samples.map((s) => s[key]));
      return {
        mode: mode.name,
        seconds: samples.length,
        visibility,
        messages: avg('messages'),
        peakMessages: peak('messages'),
        tableRenders: avg('tableRenders'),
        rowRenders: avg('rowRenders'),
        mainThreadMsPerSec: ((task - start.task) / elapsed) * 1000,
      };
    }),
  );

  const f = (n) => n.toFixed(1);
  console.log(`\nMeasured ${new Date().toISOString()} · ${os.cpus()[0]?.model ?? 'unknown CPU'} · Chromium ${browser.version()} (headless)\n`);
  console.log('| Mode | Socket msgs/s (peak) | List renders/s | Row renders/s | Main-thread busy ms/s |');
  console.log('|---|---|---|---|---|');
  for (const r of rows) {
    console.log(
      `| ${r.mode} | ${f(r.messages)} (${r.peakMessages}) | ${f(r.tableRenders)} | ${f(r.rowRenders)} | ${f(r.mainThreadMsPerSec)} |`,
    );
  }
  console.log(`\nSamples per mode: ${rows.map((r) => r.seconds).join(', ')} · page visibility: ${rows.map((r) => r.visibility).join(', ')}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
