import { CircleCheck, CirclePause, Clock } from "lucide-react"
import type { ReactNode } from "react"
import type { LinkStatus } from "../../lib/types"

const STATUS: Record<LinkStatus, { label: string; className: string; icon: ReactNode }> = {
  active: {
    label: "Ativo",
    className: "bg-success-bg text-success",
    icon: <CircleCheck aria-hidden className="size-3.5" />,
  },
  inactive: {
    label: "Desativado",
    className: "bg-page text-ink-secondary ring-1 ring-border",
    icon: <CirclePause aria-hidden className="size-3.5" />,
  },
  expired: {
    label: "Expirado",
    className: "bg-warning-bg text-warning",
    icon: <Clock aria-hidden className="size-3.5" />,
  },
}

export const STATUS_LABELS: Record<LinkStatus, string> = {
  active: STATUS.active.label,
  inactive: STATUS.inactive.label,
  expired: STATUS.expired.label,
}

// Cor, ícone e palavra juntos: o status nunca depende só da cor
export function LinkStatusBadge({ status }: { status: LinkStatus }) {
  const { label, className, icon } = STATUS[status]

  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium ${className}`}>
      {icon}
      {label}
    </span>
  )
}
