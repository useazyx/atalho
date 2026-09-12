import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router"
import { useAuth } from "../auth/AuthContext"
import { Alert } from "../components/ui/Alert"
import { Button } from "../components/ui/Button"
import { TextField } from "../components/ui/TextField"
import { ApiError, errorMessage } from "../lib/api"
import { AuthShell } from "./AuthShell"

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

// As mesmas regras do backend, pra avisar antes de mandar
function validate(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (name.trim().length < 2) errors.name = "Nome precisa de pelo menos 2 letras"
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "E-mail inválido"
  if (password.length < 8) errors.password = "Senha precisa de pelo menos 8 caracteres"
  return errors
}

export function RegisterPage() {
  const { register, status } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === "authenticated") return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const errors = validate(name, email, password)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await register(name.trim(), email.trim(), password)
      navigate("/", { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "EmailAlreadyUsed") {
        setFieldErrors({ email: caught.message })
      } else {
        setError(errorMessage(caught))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Criar conta" subtitle="Leva meio minuto. Depois é só colar o primeiro link.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <TextField label="Nome" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={fieldErrors.name} />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="Pelo menos 8 caracteres"
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        Já tem conta?{" "}
        <Link to="/entrar" className="font-medium text-link hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  )
}
