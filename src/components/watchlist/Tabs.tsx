import { cx } from '../../lib/cx';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  options: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** id of the panel these tabs control. */
  controls: string;
  label: string;
}

/** Segmented tabs (ARIA tabs pattern). Generic, so the selected value stays type-safe. */
export function Tabs<T extends string>({ options, value, onChange, controls, label }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex shrink-0 rounded-lg bg-surface-muted p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={controls}
            onClick={() => onChange(option.value)}
            className={cx(
              'h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent',
              selected ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1.5 text-fg-muted tabular-nums">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
