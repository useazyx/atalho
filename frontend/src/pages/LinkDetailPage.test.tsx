import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Link, LinkStats } from "../lib/types"
import { mockApi, renderApp } from "../test/renderApp"

const DEMO = { id: "u1", name: "Conta Demo", email: "demo@atalho.dev", created_at: "2026-09-01T00:00:00.000Z" }

const GITHUB: Link = {
  id: "l1",
  slug: "github",
  short_url: "http://localhost:3337/github",
  target_url: "https://github.com/useazyx",
  title: "Meu GitHub",
  active: true,
  status: "active",
  expires_at: null,
  total_clicks: 448,
  created_at: "2026-07-13T03:00:00.000Z",
  updated_at: "2026-07-13T03:00:00.000Z",
}

const STATS: LinkStats = {
  link_id: "l1",
  days: 30,
  time_zone: "America/Sao_Paulo",
  from: "2026-08-13",
  to: "2026-09-11",
  totals: { clicks: 228, unique_visitors: 151, previous_clicks: 190, previous_unique_visitors: 151, bot_clicks: 16 },
  daily: [
    { date: "2026-09-10", clicks: 5, unique_visitors: 4 },
    { date: "2026-09-11", clicks: 8, unique_visitors: 6 },
  ],
  referrers: [
    { label: null, clicks: 77 },
    { label: "linkedin.com", clicks: 60 },
  ],
  devices: [
    { label: "MOBILE", clicks: 130 },
    { label: "DESKTOP", clicks: 98 },
  ],
  browsers: [{ label: "Chrome", clicks: 140 }],
  languages: [
    { label: "pt-BR", clicks: 180 },
    { label: null, clicks: 10 },
  ],
}

type Handler = Parameters<typeof mockApi>[0]

const withSession = (handler: Handler) =>
  mockApi((url, init) => (url.includes("/auth/me") ? { status: 200, body: DEMO } : handler(url, init)))

describe("link detail page", () => {
  beforeEach(() => {
    localStorage.setItem("atalho.token", "t0k3n")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("compares the period with the previous one in words and shows readable rankings", async () => {
    withSession((url) => {
      if (url.includes("/stats")) return { status: 200, body: STATS }
      return { status: 200, body: GITHUB }
    })
    renderApp("/links/l1")

    expect(await screen.findByRole("heading", { name: "Meu GitHub" })).toBeInTheDocument()
    expect(await screen.findByText("+20% vs. 30 dias anteriores")).toBeInTheDocument()
    expect(screen.getByText("Igual aos 30 dias anteriores")).toBeInTheDocument()

    const origin = screen.getByRole("list", { name: "Origem" })
    expect(within(origin).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Direto ou app77 · 34%",
      "linkedin.com60 · 26%",
    ])
    expect(within(screen.getByRole("list", { name: "Dispositivo" })).getByText("Celular")).toBeInTheDocument()
    expect(within(screen.getByRole("list", { name: "Idioma" })).getByText("Português (Brasil)")).toBeInTheDocument()
    expect(screen.getByRole("table", { name: "Cliques e visitantes únicos por dia" })).toBeInTheDocument()
  })

  it("asks the API for the period picked", async () => {
    const fetchMock = withSession((url) => {
      if (url.includes("/stats")) return { status: 200, body: STATS }
      return { status: 200, body: GITHUB }
    })
    renderApp("/links/l1")

    await userEvent.click(await screen.findByRole("radio", { name: "7 dias" }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain("/api/links/l1/stats?days=7")
    )
  })

  it("edits only the target and keeps the short address", async () => {
    const fetchMock = withSession((url, init) => {
      if (url.includes("/stats")) return { status: 200, body: STATS }
      if (init.method === "PATCH") return { status: 200, body: { ...GITHUB, target_url: "https://github.com/useazyx?tab=repositories" } }
      return { status: 200, body: GITHUB }
    })
    renderApp("/links/l1")

    await userEvent.click(await screen.findByRole("button", { name: "Editar" }))
    const target = screen.getByLabelText("Endereço de destino")
    await userEvent.clear(target)
    await userEvent.type(target, "https://github.com/useazyx?tab=repositories")
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH")
      expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ target_url: "https://github.com/useazyx?tab=repositories" })
    })
    expect(await screen.findByText("github.com/useazyx?tab=repositories")).toBeInTheDocument()
  })

  it("explains when the link does not exist anymore", async () => {
    withSession(() => ({ status: 404, body: { error: "LinkNotFound", message: "Link não encontrado" } }))
    renderApp("/links/sumiu")

    expect(await screen.findByRole("alert")).toHaveTextContent("Esse link não existe mais")
    expect(screen.getByRole("link", { name: "Todos os links" })).toHaveAttribute("href", "/")
  })
})
