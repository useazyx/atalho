import { CircleAlert, CircleCheck, Info } from "lucide-react"
import type { ReactNode } from "react"

type Tone = "error" | "success" | "info"

const TONES: Record<Tone, { className: string; icon: ReactNode }> = {
  error: { className: "bg-danger-bg text-danger", icon: <CircleAlert aria-hidden className="size-4 shrink-0" /> },
  success: { className: "bg-success-bg text-success", icon: <CircleCheck aria-hidden className="size-4 shrink-0" /> },
  info: { className: "bg-page text-ink-secondary border border-border", icon: <Info aria-hidden className="size-4 shrink-0" /> },
}

export function Alert({ tone = "error", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${TONES[tone].className}`}>
      <span className="mt-0.5">{TONES[tone].icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
