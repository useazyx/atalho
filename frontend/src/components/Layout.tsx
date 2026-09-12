import { BookOpen, Link2, LogOut } from "lucide-react"
import { Link, NavLink, Outlet } from "react-router"
import { useAuth } from "../auth/AuthContext"

// A documentação interativa fica na própria API (Swagger em /docs)
export const API_DOCS_URL = import.meta.env.VITE_API_DOCS_URL ?? "http://localhost:3337/docs"

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? "bg-surface-raised text-ink ring-1 ring-border" : "text-ink-secondary hover:text-ink"
  }`

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-page/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link to="/" className="mr-2 flex items-center gap-2 rounded-lg text-ink focus-visible:outline-2 focus-visible:outline-focus">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-on-primary">
              <Link2 aria-hidden className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Atalho</span>
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Links
            </NavLink>
            <a href={API_DOCS_URL} target="_blank" rel="noreferrer" className={navClass({ isActive: false })}>
              <BookOpen aria-hidden className="mr-1.5 hidden size-4 sm:block" />
              API
            </a>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-ink-secondary sm:block">{user?.name}</span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-secondary hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
            >
              <LogOut aria-hidden className="size-4" />
              <span className="hidden sm:inline">Sair</span>
              <span className="sr-only sm:hidden">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 md:pt-10">
        <Outlet />
      </main>
    </div>
  )
}
