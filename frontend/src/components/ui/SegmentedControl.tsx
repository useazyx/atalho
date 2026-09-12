interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}

// Botões lado a lado pra escolher uma opção (tipo "7 dias | 30 dias | 90 dias")
export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 max-w-full overflow-x-auto rounded-lg border border-border bg-surface-raised p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`shrink-0 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-focus ${
            value === option.value ? "bg-page text-ink shadow-sm ring-1 ring-border" : "text-ink-secondary hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
