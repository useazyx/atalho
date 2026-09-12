import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Link } from "../lib/types"
import { mockApi, renderApp } from "../test/renderApp"

const DEMO = { id: "u1", name: "Conta Demo", email: "demo@atalho.dev", created_at: "2026-09-01T00:00:00.000Z" }

const makeLink = (overrides: Partial<Link>): Link => ({
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
  ...overrides,
})

const GITHUB = makeLink({})
const listOf = (links: Link[]) => ({ status: 200, body: { links, total: links.length, current_page: 1, total_pages: 1 } })

// Todas as chamadas feitas pra API, como "GET /api/links?page=1"
const callsOf = (fetchMock: ReturnType<typeof mockApi>) =>
  fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? "GET"} ${String(url)}`)

const bodyOf = (fetchMock: ReturnType<typeof mockApi>, method: string) => {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === method)
  return call ? JSON.parse(String(call[1]?.body)) : undefined
}

describe("links page", () => {
  beforeEach(() => {
    localStorage.setItem("atalho.token", "t0k3n")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("shortens an address pasted without protocol and shows the short link ready to copy", async () => {
    const created = makeLink({
      id: "l9",
      slug: "Xy7kP2q",
      short_url: "http://localhost:3337/Xy7kP2q",
      target_url: "https://github.com/useazyx/atalho",
      title: null,
      total_clicks: 0,
    })
    const fetchMock = mockApi((url, init) => {
      if (url.includes("/auth/me")) return { status: 200, body: DEMO }
      if (url.includes("/links") && init.method === "POST") return { status: 201, body: created }
      return listOf([GITHUB])
    })
    renderApp("/")

    await userEvent.type(await screen.findByLabelText("Endereço de destino"), "github.com/useazyx/atalho")
    await userEvent.click(screen.getByRole("button", { name: "Encurtar" }))

    expect(await screen.findByText("localhost:3337/Xy7kP2q")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Copiar localhost:3337/Xy7kP2q" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Estatísticas" })).toHaveAttribute("href", "/links/l9")
    expect(bodyOf(fetchMock, "POST")).toEqual({ target_url: "https://github.com/useazyx/atalho" })
  })

  it("shows a taken alias under the alias field", async () => {
    mockApi((url, init) => {
      if (url.includes("/auth/me")) return { status: 200, body: DEMO }
      if (url.includes("/links") && init.method === "POST") {
        return { status: 409, body: { error: "AliasTaken", message: "Esse apelido já está em uso, escolhe outro" } }
      }
      return listOf([GITHUB])
    })
    renderApp("/")

    await userEvent.type(await screen.findByLabelText("Endereço de destino"), "https://example.com")
    await userEvent.click(screen.getByRole("button", { name: "Apelido, título e validade" }))
    await userEvent.type(screen.getByLabelText("Apelido (opcional)"), "GitHub")
    await userEvent.click(screen.getByRole("button", { name: "Encurtar" }))

    expect(await screen.findByText("Esse apelido já está em uso, escolhe outro")).toBeInTheDocument()
    expect(screen.getByLabelText("Apelido (opcional)")).toHaveValue("github")
    expect(screen.getByLabelText("Apelido (opcional)")).toHaveAttribute("aria-invalid", "true")
  })

  it("filters by status and search, asking the API with the same filters", async () => {
    const fetchMock = mockApi((url) => {
      if (url.includes("/auth/me")) return { status: 200, body: DEMO }
      return listOf([GITHUB])
    })
    renderApp("/")

    await screen.findByRole("link", { name: "Meu GitHub" })
    await userEvent.click(screen.getByRole("radio", { name: "Desativados" }))
    await waitFor(() => expect(callsOf(fetchMock)).toContain("GET /api/links?status=inactive&page=1&page_size=20"))

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar links" }), "slides")
    await waitFor(() =>
      expect(callsOf(fetchMock)).toContain("GET /api/links?search=slides&status=inactive&page=1&page_size=20")
    )
  })

  it("deactivates and deletes a link from its row", async () => {
    const fetchMock = mockApi((url, init) => {
      if (url.includes("/auth/me")) return { status: 200, body: DEMO }
      if (init.method === "PATCH") return { status: 200, body: makeLink({ active: false, status: "inactive" }) }
      if (init.method === "DELETE") return { status: 204 }
      return listOf([GITHUB])
    })
    renderApp("/")

    await userEvent.click(await screen.findByRole("button", { name: "Desativar localhost:3337/github" }))
    await waitFor(() => expect(bodyOf(fetchMock, "PATCH")).toEqual({ active: false }))

    await userEvent.click(screen.getByRole("button", { name: "Apagar localhost:3337/github" }))
    await userEvent.click(screen.getByRole("button", { name: "Apagar" }))
    await waitFor(() => expect(callsOf(fetchMock)).toContain("DELETE /api/links/l1"))
  })

  it("opens the QR code with the image from the API and closes it with Escape", async () => {
    mockApi((url) => {
      if (url.includes("/auth/me")) return { status: 200, body: DEMO }
      if (url.includes("/qr")) return { status: 200, text: "<svg></svg>", contentType: "image/svg+xml" }
      return listOf([GITHUB])
    })
    renderApp("/")

    await userEvent.click(await screen.findByRole("button", { name: "QR code de localhost:3337/github" }))

    expect(await screen.findByRole("dialog", { name: "QR code" })).toBeInTheDocument()
    expect(await screen.findByRole("img", { name: "QR code de localhost:3337/github" })).toBeInTheDocument()

    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
