import { LoaderCircle } from "lucide-react"
import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router"
import { RequireAuth } from "./auth/RequireAuth"
import { Layout } from "./components/Layout"
import { LinksPage } from "./pages/LinksPage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"

// O detalhe carrega sob demanda: o gráfico (Recharts) só baixa quando alguém abre as estatísticas
const LinkDetailPage = lazy(() => import("./pages/LinkDetailPage").then((module) => ({ default: module.LinkDetailPage })))

function PageLoading() {
  return (
    <div className="grid place-items-center py-20" role="status" aria-label="Carregando página">
      <LoaderCircle aria-hidden className="size-6 animate-spin text-ink-muted" />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/criar-conta" element={<RegisterPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<LinksPage />} />
        <Route
          path="links/:id"
          element={
            <Suspense fallback={<PageLoading />}>
              <LinkDetailPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
