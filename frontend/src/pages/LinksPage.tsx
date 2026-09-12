import { useQuery } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"
import { useAuth } from "../auth/AuthContext"
import { LinkRow } from "../components/links/LinkRow"
import { Alert } from "../components/ui/Alert"
import { formatNumber } from "../lib/format"
import type { LinkList } from "../lib/types"

const PAGE_SIZE = 20

export function LinksPage() {
  const { request } = useAuth()

  const links = useQuery({
    queryKey: ["links", { page: 1 }],
    queryFn: () => request<LinkList>("/links", { query: { page: 1, page_size: PAGE_SIZE } }),
  })

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Links</h1>
        {links.data && (
          <p className="mt-1 text-sm text-ink-muted">
            {links.data.total === 1 ? "1 link" : `${formatNumber(links.data.total)} links`}
          </p>
        )}
      </header>

      <div className="mt-6">
        {links.isPending && (
          <div className="grid place-items-center py-16" role="status" aria-label="Carregando links">
            <LoaderCircle aria-hidden className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {links.isError && <Alert>{links.error.message}</Alert>}

        {links.data && links.data.links.length === 0 && (
          <p className="rounded-xl border border-dashed border-border-strong px-4 py-12 text-center text-sm text-ink-muted">
            Nenhum link ainda.
          </p>
        )}

        {links.data && links.data.links.length > 0 && (
          <ul aria-label="Meus links" className="overflow-hidden rounded-xl border border-border bg-surface">
            {links.data.links.map((link) => (
              <LinkRow key={link.id} link={link} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
