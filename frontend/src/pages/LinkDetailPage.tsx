import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ArrowLeft, LoaderCircle } from "lucide-react"
import { useState } from "react"
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router"
import { useAuth } from "../auth/AuthContext"
import { LinkHeader } from "../components/links/LinkHeader"
import { BreakdownCard } from "../components/stats/BreakdownCard"
import { ClicksChart } from "../components/stats/ClicksChart"
import { StatTile } from "../components/stats/StatTile"
import { Alert } from "../components/ui/Alert"
import { Card } from "../components/ui/Card"
import { SegmentedControl } from "../components/ui/SegmentedControl"
import { ApiError } from "../lib/api"
import { formatDay } from "../lib/format"
import { browserLabel, deviceLabel, languageLabel, referrerLabel } from "../lib/labels"
import type { Link, LinkStats } from "../lib/types"

const PERIODS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
] as const

type Period = (typeof PERIODS)[number]["value"]
const DEFAULT_PERIOD: Period = "30"

const isPeriod = (value: string | null): value is Period => PERIODS.some((period) => period.value === value)

function BackLink() {
  return (
    <RouterLink
      to="/"
      className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-secondary hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
    >
      <ArrowLeft aria-hidden className="size-4" />
      Todos os links
    </RouterLink>
  )
}

export function LinkDetailPage() {
  const { id = "" } = useParams()
  const { request } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [actionError, setActionError] = useState<string | null>(null)

  // O período fica na URL (?dias=7): dá pra mandar o link da tela já filtrada
  const requestedPeriod = searchParams.get("dias")
  const period: Period = isPeriod(requestedPeriod) ? requestedPeriod : DEFAULT_PERIOD
  const days = Number(period)

  const link = useQuery({
    queryKey: ["link", id],
    queryFn: () => request<Link>(`/links/${id}`),
  })

  // Trocar o período mantém o gráfico anterior apagadinho até chegar o novo (sem piscar a tela)
  const stats = useQuery({
    queryKey: ["stats", id, days],
    queryFn: () => request<LinkStats>(`/links/${id}/stats`, { query: { days } }),
    placeholderData: keepPreviousData,
    enabled: link.isSuccess,
  })

  if (link.isPending) {
    return (
      <div className="grid place-items-center py-20" role="status" aria-label="Carregando link">
        <LoaderCircle aria-hidden className="size-6 animate-spin text-ink-muted" />
      </div>
    )
  }

  if (link.isError) {
    const notFound = link.error instanceof ApiError && link.error.status === 404
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert>{notFound ? "Esse link não existe mais (ou não é da sua conta)." : link.error.message}</Alert>
      </div>
    )
  }

  const data = stats.data

  return (
    <div>
      <BackLink />

      <div className="mt-4">
        <LinkHeader link={link.data} onError={setActionError} onDeleted={() => navigate("/", { replace: true })} />
      </div>

      {actionError && (
        <div className="mt-4">
          <Alert>{actionError}</Alert>
        </div>
      )}

      <section aria-label="Estatísticas" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            label="Período"
            value={period}
            options={[...PERIODS]}
            onChange={(value) => setSearchParams(value === DEFAULT_PERIOD ? {} : { dias: value }, { replace: true })}
          />
          {data && (
            <p className="text-sm text-ink-muted">
              {formatDay(data.from)} a {formatDay(data.to)} · horário de Brasília
            </p>
          )}
        </div>

        {stats.isError && (
          <div className="mt-4">
            <Alert>{stats.error.message}</Alert>
          </div>
        )}

        {stats.isPending && !data && (
          <div className="grid place-items-center py-20" role="status" aria-label="Carregando estatísticas">
            <LoaderCircle aria-hidden className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {data && (
          <div className={`mt-4 space-y-4 transition-opacity ${stats.isPlaceholderData ? "opacity-60" : ""}`} aria-busy={stats.isFetching}>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile label="Cliques" value={data.totals.clicks} previous={data.totals.previous_clicks} days={days} />
              <StatTile
                label="Visitantes únicos"
                value={data.totals.unique_visitors}
                previous={data.totals.previous_unique_visitors}
                days={days}
              />
              <StatTile
                label="Robôs filtrados"
                value={data.totals.bot_clicks}
                days={days}
                note="Previews de WhatsApp e crawlers não entram nos outros números"
              />
            </div>

            <Card title="Cliques por dia" description="A mesma pessoa em dias diferentes conta como visitante nos dois dias.">
              <ClicksChart daily={data.daily} />
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <BreakdownCard
                title="Origem"
                description="Site de onde a pessoa clicou"
                items={data.referrers}
                total={data.totals.clicks}
                formatLabel={referrerLabel}
              />
              <BreakdownCard
                title="Dispositivo"
                description="Pelo navegador de quem abriu"
                items={data.devices}
                total={data.totals.clicks}
                formatLabel={deviceLabel}
              />
              <BreakdownCard
                title="Navegador"
                description="Família do navegador"
                items={data.browsers}
                total={data.totals.clicks}
                formatLabel={browserLabel}
              />
              <BreakdownCard
                title="Idioma"
                description="Idioma principal do navegador"
                items={data.languages}
                total={data.totals.clicks}
                formatLabel={languageLabel}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
