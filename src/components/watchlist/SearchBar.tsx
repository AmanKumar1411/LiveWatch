interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-muted"
      >
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or symbol"
        aria-label="Search coins"
        autoComplete="off"
        spellCheck={false}
        className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-2 focus:outline-accent/30"
      />
    </div>
  );
}
