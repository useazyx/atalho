import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { describeChange, formatNumber } from "../../lib/format"

interface StatTileProps {
  label: string
  value: number
  // Sem previous não tem comparação (aí aparece a nota)
  previous?: number
  days: number
  note?: string
}

// Número grande com a comparação em palavras: seta e cor só reforçam o texto
export function StatTile({ label, value, previous, days, note }: StatTileProps) {
  const change = previous === undefined ? null : describeChange(value, previous, days)

  const tone =
    !change || change.direction === "flat" ? "text-ink-muted" : change.direction === "down" ? "text-danger" : "text-success"
  const Icon = change?.direction === "down" ? ArrowDownRight : change?.direction === "flat" ? Minus : ArrowUpRight

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-sm text-ink-secondary">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">{formatNumber(value)}</p>
      {change ? (
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${tone}`}>
          <Icon aria-hidden className="size-3.5 shrink-0" />
          {change.text}
        </p>
      ) : note ? (
        <p className="mt-1.5 text-xs text-ink-muted">{note}</p>
      ) : null}
    </div>
  )
}
