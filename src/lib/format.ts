// Intl formatters are expensive to create, so build each one once and reuse it.

const priceFormatters = new Map<number, Intl.NumberFormat>();

export function formatPrice(value: number, decimals: number): string {
  let formatter = priceFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    priceFormatters.set(decimals, formatter);
  }
  return formatter.format(value);
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});

/** Binance sends 24h change already in percent: 1.234 → "+1.23%". */
export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

const compactUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});

/** 1234567890 → "$1.23B". */
export function formatCompactUsd(value: number): string {
  return compactUsdFormatter.format(value);
}

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Epoch ms → "14:05" in the viewer's time zone. */
export function formatTime(ms: number): string {
  return timeFormatter.format(ms);
}

const axisFormatters = new Map<number, Intl.NumberFormat>();

/** Chart axis ticks: no currency sign, and no trailing zeros ("72,950", "0.0671"). */
export function formatAxisPrice(value: number, maxDecimals: number): string {
  let formatter = axisFormatters.get(maxDecimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: maxDecimals });
    axisFormatters.set(maxDecimals, formatter);
  }
  return formatter.format(value);
}
