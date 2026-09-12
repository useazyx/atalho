import { LoaderCircle } from "lucide-react"
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import { useAuth } from "./AuthContext"

// Porteiro do front: sem sessão, vai pro login (e volta pra onde estava depois de entrar)
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center" role="status" aria-label="Carregando">
        <LoaderCircle aria-hidden className="size-6 animate-spin text-ink-muted" />
      </div>
    )
  }

  if (status === "anonymous") {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}
