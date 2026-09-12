import { formatNumber, formatPercent } from "../../lib/format"
import type { BreakdownItem } from "../../lib/types"
import { Card } from "../ui/Card"

interface BreakdownCardProps {
  title: string
  description: string
  items: BreakdownItem[]
  // Cliques de gente no período, pra calcular a parte de cada item
  total: number
  formatLabel: (label: string | null) => string
}

// Ranking em barras horizontais finas: o número fica escrito do lado, a barra só dá a proporção.
// Uma série só, então uma cor só (a primeira da paleta) pra todas as barras.
export function BreakdownCard({ title, description, items, total, formatLabel }: BreakdownCardProps) {
  const largest = Math.max(1, ...items.map((item) => item.clicks))

  return (
    <Card title={title} description={description}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">Sem cliques no período.</p>
      ) : (
        <ol aria-label={title} className="space-y-3">
          {items.map((item) => {
            const label = formatLabel(item.label)
            return (
              <li key={item.label ?? "sem-valor"}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink" title={label}>
                    {label}
                  </span>
                  <span className="shrink-0">
                    <span className="tabular font-semibold text-ink">{formatNumber(item.clicks)}</span>
                    <span className="tabular text-ink-muted"> · {formatPercent(total > 0 ? item.clicks / total : 0)}</span>
                  </span>
                </div>
                <div aria-hidden className="mt-1.5 h-2">
                  <div className="h-full rounded-r-[4px] bg-series-1" style={{ width: `${Math.max(1.5, (item.clicks / largest) * 100)}%` }} />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
