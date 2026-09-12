import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { ApiError, apiBlob, apiRequest, type RequestOptions } from "../lib/api"
import type { User } from "../lib/types"

const TOKEN_KEY = "atalho.token"

type AuthStatus = "loading" | "authenticated" | "anonymous"
type AuthedOptions = Omit<RequestOptions, "token">

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  // Chamadas autenticadas: põem o token e, se a sessão venceu (401), deslogam
  request: <T>(path: string, options?: AuthedOptions) => Promise<T>
  requestBlob: (path: string, options?: AuthedOptions) => Promise<Blob>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// localStorage pode estar bloqueado (aba anônima, política do navegador): aí a sessão só dura a aba
const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
const writeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // sem armazenamento, segue só em memória
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken)
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(token ? "loading" : "anonymous")

  const logout = useCallback(() => {
    writeToken(null)
    setToken(null)
    setUser(null)
    setStatus("anonymous")
  }, [])

  const withSession = useCallback(
    async <T,>(call: () => Promise<T>) => {
      try {
        return await call()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) logout()
        throw error
      }
    },
    [logout]
  )

  const request = useCallback(
    <T,>(path: string, options: AuthedOptions = {}) => withSession(() => apiRequest<T>(path, { ...options, token })),
    [token, withSession]
  )

  const requestBlob = useCallback(
    (path: string, options: AuthedOptions = {}) => withSession(() => apiBlob(path, { ...options, token })),
    [token, withSession]
  )

  // Abriu com token guardado: confere se ainda vale antes de mostrar o app
  useEffect(() => {
    if (!token || user) return
    apiRequest<User>("/auth/me", { token })
      .then((me) => {
        setUser(me)
        setStatus("authenticated")
      })
      .catch(logout)
  }, [token, user, logout])

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    })
    writeToken(result.token)
    setToken(result.token)
    setUser(result.user)
    setStatus("authenticated")
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await apiRequest<User>("/auth/register", { method: "POST", body: { name, email, password } })
      await login(email, password)
    },
    [login]
  )

  const value = useMemo(
    () => ({ user, status, login, register, logout, request, requestBlob }),
    [user, status, login, register, logout, request, requestBlob]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth precisa estar dentro do AuthProvider")
  return context
}
