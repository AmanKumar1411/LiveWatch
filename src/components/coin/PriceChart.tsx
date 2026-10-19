import { memo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatAxisPrice, formatPrice, formatTime } from '../../lib/format';
import type { PricePoint } from '../../types';

interface PriceChartProps {
  points: PricePoint[];
  decimals: number;
  coinName: string;
}

/**
 * Single-series price line. Colours come from CSS tokens (see .price-chart in index.css),
 * so the chart follows the theme. Animation is off: with live data it would restart on
 * every update and the line would never settle.
 * Memoised: it re-renders only when `points` changes, not on every flush of the page.
 */
export const PriceChart = memo(function PriceChart({ points, decimals, coinName }: PriceChartProps) {
  const first = points[0];
  const last = points.at(-1);
  const summary =
    first && last
      ? `${coinName} price over the last ${points.length} minutes: from ${formatPrice(first.close, decimals)} to ${formatPrice(last.close, decimals)}.`
      : `${coinName} price chart`;

  return (
    <div role="img" aria-label={summary} className="price-chart h-64 w-full min-w-0 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTime}
            tickLine={false}
            axisLine={false}
            minTickGap={48}
            tickMargin={8}
          />
          <YAxis
            orientation="right"
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => formatAxisPrice(value, decimals)}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            isAnimationActive={false}
            separator=": "
            formatter={(value: number) => [formatPrice(value, decimals), 'Price']}
            labelFormatter={(time: number) => formatTime(time)}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 13,
            }}
            labelStyle={{ color: 'var(--color-fg-muted)' }}
            itemStyle={{ color: 'var(--color-fg)' }}
          />
          <Area
            type="linear"
            dataKey="close"
            strokeWidth={2}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
