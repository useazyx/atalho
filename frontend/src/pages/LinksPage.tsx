import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { LoaderCircle, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { useAuth } from "../auth/AuthContext"
import { CreateLinkPanel } from "../components/links/CreateLinkPanel"
import { LinkRow } from "../components/links/LinkRow"
import { Alert } from "../components/ui/Alert"
import { Button } from "../components/ui/Button"
import { Pagination } from "../components/ui/Pagination"
import { SegmentedControl } from "../components/ui/SegmentedControl"
import { formatNumber } from "../lib/format"
import type { LinkList, LinkStatus } from "../lib/types"
import { useDebouncedValue } from "../lib/useDebouncedValue"

const PAGE_SIZE = 20

type StatusFilter = "all" | LinkStatus

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Desativados" },
  { value: "expired", label: "Expirados" },
]

const isStatusFilter = (value: string | null): value is StatusFilter =>
  STATUS_OPTIONS.some((option) => option.value === value)

export function LinksPage() {
  const { request } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [actionError, setActionError] = useState<string | null>(null)

  // Os filtros ficam na URL (?busca=&status=&pagina=): recarregar ou mandar o link mantém a mesma lista
  const statusParam = searchParams.get("status")
  const status: StatusFilter = isStatusFilter(statusParam) ? statusParam : "all"
  const search = searchParams.get("busca") ?? ""
  const page = Math.max(1, Number(searchParams.get("pagina")) || 1)
  const hasFilters = status !== "all" || search !== ""

  const [searchText, setSearchText] = useState(search)
  const debouncedSearch = useDebouncedValue(searchText.trim())

  function updateParams(changes: Record<string, string | null>) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true }
    )
  }

  // Parou de digitar: a busca vai pra URL e a lista volta pra primeira página
  useEffect(() => {
    if (debouncedSearch === search) return
    updateParams({ busca: debouncedSearch, pagina: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const links = useQuery({
    queryKey: ["links", { search, status, page }],
    queryFn: () =>
      request<LinkList>("/links", {
        query: { search, status: status === "all" ? undefined : status, page, page_size: PAGE_SIZE },
      }),
    // Trocar filtro ou página mantém a lista anterior apagadinha até a nova chegar
    placeholderData: keepPreviousData,
  })

  // Apagou o último link da última página: volta uma página em vez de mostrar lista vazia
  const totalPages = links.data?.total_pages ?? 1
  useEffect(() => {
    if (links.data && !links.isPlaceholderData && page > totalPages) {
      updateParams({ pagina: totalPages > 1 ? String(totalPages) : null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links.data, links.isPlaceholderData, page, totalPages])

  function clearFilters() {
    setSearchText("")
    setSearchParams({}, { replace: true })
  }

  const data = links.data

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Links</h1>
        <p className="mt-1 text-sm text-ink-muted">Cola um endereço longo, ganha um curto e acompanha quem clicou.</p>
      </header>

      <CreateLinkPanel />

      <section aria-labelledby="my-links-heading">
        <h2 id="my-links-heading" className="text-base font-semibold text-ink">
          Meus links
          {data && (
            <span className="font-normal text-ink-muted">
              {" "}
              · {data.total === 1 ? "1 link" : `${formatNumber(data.total)} links`}
            </span>
          )}
        </h2>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:w-80">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              aria-label="Buscar links"
              placeholder="Buscar por título, apelido ou destino"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface-raised pr-3 pl-9 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-focus focus:ring-2 focus:ring-focus/20"
            />
          </div>
          <SegmentedControl
            label="Filtrar por status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => updateParams({ status: value === "all" ? null : value, pagina: null })}
          />
        </div>

        {actionError && (
          <div className="mt-4">
            <Alert>{actionError}</Alert>
          </div>
        )}

        <div className="mt-4">
          {links.isPending && (
            <div className="grid place-items-center py-16" role="status" aria-label="Carregando links">
              <LoaderCircle aria-hidden className="size-6 animate-spin text-ink-muted" />
            </div>
          )}

          {links.isError && <Alert>{links.error.message}</Alert>}

          {data && data.links.length === 0 && (
            <div className="rounded-xl border border-dashed border-border-strong px-4 py-12 text-center">
              {hasFilters ? (
                <>
                  <p className="text-sm text-ink-secondary">Nenhum link com esse filtro.</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </>
              ) : (
                <p className="text-sm text-ink-secondary">Nenhum link ainda. Cola o primeiro endereço aqui em cima.</p>
              )}
            </div>
          )}

          {data && data.links.length > 0 && (
            <ul
              aria-label="Meus links"
              className={`overflow-hidden rounded-xl border border-border bg-surface transition-opacity ${
                links.isPlaceholderData ? "opacity-60" : ""
              }`}
            >
              {data.links.map((link) => (
                <LinkRow key={link.id} link={link} onError={setActionError} />
              ))}
            </ul>
          )}
        </div>

        {data && (
          <div className="mt-4">
            <Pagination page={page} totalPages={data.total_pages} onChange={(next) => updateParams({ pagina: next > 1 ? String(next) : null })} />
          </div>
        )}
      </section>
    </div>
  )
}
