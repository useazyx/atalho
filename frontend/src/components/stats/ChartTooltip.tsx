// Caixinha do tooltip: o valor em destaque e o nome da série menor, com um tracinho da cor da série
export interface TooltipRow {
  color: string
  name: string
  value: string
}

export function ChartTooltip({ title, rows }: { title?: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-44 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm shadow-lg">
      {title && <p className="mb-1 text-xs text-ink-muted first-letter:uppercase">{title}</p>}
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2">
            <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: row.color }} />
            <span className="tabular font-semibold text-ink">{row.value}</span>
            <span className="truncate text-ink-secondary">{row.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
