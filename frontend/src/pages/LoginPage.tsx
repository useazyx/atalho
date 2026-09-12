import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router"
import { useAuth } from "../auth/AuthContext"
import { Alert } from "../components/ui/Alert"
import { Button } from "../components/ui/Button"
import { TextField } from "../components/ui/TextField"
import { errorMessage } from "../lib/api"
import { AuthShell } from "./AuthShell"

// A mesma conta que o seed do backend cria
export const DEMO_CREDENTIALS = { email: "demo@atalho.dev", password: "atalho123" }

export function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/"

  if (status === "authenticated") return <Navigate to={redirectTo} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Entrar" subtitle="Seus links, cliques e QR codes.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <TextField label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Entrar
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-border bg-surface p-3 text-sm text-ink-secondary">
        <p>
          Só olhando? A conta demo tem 6 links e 60 dias de cliques:{" "}
          <span className="font-mono text-[13px] text-ink">{DEMO_CREDENTIALS.email}</span>
        </p>
        <button
          type="button"
          className="mt-2 font-medium text-link hover:underline"
          onClick={() => {
            setEmail(DEMO_CREDENTIALS.email)
            setPassword(DEMO_CREDENTIALS.password)
          }}
        >
          Preencher com a conta demo
        </button>
      </div>

      <p className="mt-6 text-sm text-ink-muted">
        Ainda não tem conta?{" "}
        <Link to="/criar-conta" className="font-medium text-link hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthShell>
  )
}
