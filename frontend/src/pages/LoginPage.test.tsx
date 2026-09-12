import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockApi, renderApp } from "../test/renderApp"

const DEMO = { id: "u1", name: "Conta Demo", email: "demo@atalho.dev", created_at: "2026-09-01T00:00:00.000Z" }

const GITHUB_LINK = {
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

describe("login", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sends people without a session to the login page", async () => {
    mockApi(() => ({ status: 200, body: {} }))

    renderApp("/")

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument()
  })

  it("shows the API message when the password is wrong", async () => {
    mockApi(() => ({ status: 401, body: { error: "InvalidCredentials", message: "E-mail ou senha incorretos" } }))
    renderApp("/entrar")

    await userEvent.type(screen.getByLabelText("E-mail"), "demo@atalho.dev")
    await userEvent.type(screen.getByLabelText("Senha"), "errada")
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos")
  })

  it("fills the demo account, logs in and lists the links", async () => {
    const fetchMock = mockApi((url) => {
      if (url.endsWith("/auth/login")) return { status: 200, body: { token: "t0k3n", user: DEMO } }
      if (url.includes("/links")) return { status: 200, body: { links: [GITHUB_LINK], total: 1, current_page: 1, total_pages: 1 } }
      return { status: 404, body: { error: "RouteNotFound", message: "Fora deste teste" } }
    })
    renderApp("/entrar")

    await userEvent.click(screen.getByRole("button", { name: "Preencher com a conta demo" }))
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }))

    expect(await screen.findByRole("link", { name: "Meu GitHub" })).toHaveAttribute("href", "/links/l1")
    expect(screen.getByText("localhost:3337/github")).toBeInTheDocument()
    expect(screen.getByText("Ativo")).toBeInTheDocument()

    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(String(init?.body))).toEqual({ email: "demo@atalho.dev", password: "atalho123" })
    expect(localStorage.getItem("atalho.token")).toBe("t0k3n")
  })

  it("validates the sign up form before calling the API and shows a taken e-mail on the field", async () => {
    const fetchMock = mockApi(() => ({
      status: 409,
      body: { error: "EmailAlreadyUsed", message: "Esse e-mail já tem conta. Faz login ou usa outro e-mail" },
    }))
    renderApp("/criar-conta")

    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    expect(screen.getByText("Nome precisa de pelo menos 2 letras")).toBeInTheDocument()
    expect(screen.getByText("Senha precisa de pelo menos 8 caracteres")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText("Nome"), "Ana")
    await userEvent.type(screen.getByLabelText("E-mail"), "demo@atalho.dev")
    await userEvent.type(screen.getByLabelText("Senha"), "senha-longa-123")
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    expect(await screen.findByText("Esse e-mail já tem conta. Faz login ou usa outro e-mail")).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true")
  })
})
