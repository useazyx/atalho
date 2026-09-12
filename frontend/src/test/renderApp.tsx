import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { vi } from "vitest"
import { AppRoutes } from "../AppRoutes"
import { AuthProvider } from "../auth/AuthContext"

interface MockResponse {
  status: number
  body?: unknown
  // Resposta que não é JSON (a imagem do QR code)
  text?: string
  contentType?: string
}

type Handler = (url: string, init: RequestInit) => MockResponse

// Finge a API: cada chamada passa pelo handler, que devolve status e corpo
export function mockApi(handler: Handler) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const { status, body, text, contentType } = handler(String(input), init)
    const payload = text ?? (body === undefined || status === 204 ? null : JSON.stringify(body))
    return new Response(payload, {
      status,
      headers: { "Content-Type": contentType ?? "application/json" },
    })
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

// O app inteiro (rotas, sessão e cache) numa URL inicial
export function renderApp(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}
