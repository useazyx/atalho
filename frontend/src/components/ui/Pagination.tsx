import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./Button"

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
      <p className="text-sm text-ink-muted">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<ChevronLeft aria-hidden className="size-4" />}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Próxima
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
