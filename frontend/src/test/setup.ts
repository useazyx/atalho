import "@testing-library/jest-dom/vitest"
import { cleanup, configure } from "@testing-library/react"
import { afterEach } from "vitest"

// As páginas carregam sob demanda; na primeira vez o jsdom leva mais de 1s pra montar o Recharts
configure({ asyncUtilTimeout: 5000 })

// O jsdom não tem ResizeObserver, matchMedia nem URL.createObjectURL, que os gráficos, o tema e o QR code usam
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

URL.createObjectURL ??= () => "blob:atalho-teste"
URL.revokeObjectURL ??= () => {}

// Cada teste começa com a tela limpa e sem sessão guardada
afterEach(() => {
  cleanup()
  localStorage.clear()
})
