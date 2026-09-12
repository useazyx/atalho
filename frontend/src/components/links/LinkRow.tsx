import { Link as RouterLink } from "react-router"
import { formatDate, formatNumber, hostOf, withoutProtocol } from "../../lib/format"
import type { Link } from "../../lib/types"
import { LinkStatusBadge } from "./LinkStatusBadge"

// Uma linha da lista: o que o link é (título ou domínio), o endereço curto, pra onde vai e quantos cliques teve
export function LinkRow({ link }: { link: Link }) {
  return (
    <li className="border-t border-border first:border-t-0">
      <div className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <RouterLink
              to={`/links/${link.id}`}
              className="truncate text-sm font-medium text-ink hover:underline focus-visible:outline-2 focus-visible:outline-focus"
            >
              {link.title ?? hostOf(link.target_url)}
            </RouterLink>
            <LinkStatusBadge status={link.status} />
          </div>
          <p className="mt-1 truncate font-mono text-[13px] text-ink">{withoutProtocol(link.short_url)}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-muted" title={link.target_url}>
            <span aria-hidden>↳ </span>
            <span className="sr-only">Destino: </span>
            {withoutProtocol(link.target_url)}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm sm:justify-end">
          <p className="text-ink-secondary">
            <span className="tabular font-semibold text-ink">{formatNumber(link.total_clicks)}</span>{" "}
            {link.total_clicks === 1 ? "clique" : "cliques"}
          </p>
          <p className="text-ink-muted">{formatDate(link.created_at)}</p>
        </div>
      </div>
    </li>
  )
}
