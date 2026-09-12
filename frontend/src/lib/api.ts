import type { ApiErrorBody } from "./types"

// Sem .env o front fala com /api, e o proxy do Vite leva pra API na porta 3337
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api"

export const OFFLINE_MESSAGE =
  "Não consegui falar com a API. Confere se o backend está rodando (npm run dev na pasta backend)."

// Erro da API no formato { error, message } que o backend sempre devolve
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public issues: ApiErrorBody["issues"] = []
  ) {
    super(message)
  }
}

type QueryValue = string | number | undefined | null

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, QueryValue>
  token?: string | null
}

function buildUrl(path: string, query: RequestOptions["query"]) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  }
  const search = params.toString()
  return `${BASE_URL}${path}${search ? `?${search}` : ""}`
}

async function send(path: string, options: RequestOptions) {
  const headers: Record<string, string> = {}
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let body: string | undefined
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), { method: options.method ?? "GET", headers, body })
  } catch {
    throw new ApiError(0, "ApiOffline", OFFLINE_MESSAGE)
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as Partial<ApiErrorBody> | null
    // Com o backend desligado, o proxy do Vite responde 5xx sem JSON
    if (!data && response.status >= 500) throw new ApiError(response.status, "ApiOffline", OFFLINE_MESSAGE)
    throw new ApiError(
      response.status,
      data?.error ?? "RequestError",
      data?.message ?? "Algo deu errado. Tenta de novo.",
      data?.issues
    )
  }

  return response
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// Pra resposta que não é JSON (a imagem do QR code)
export async function apiBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await send(path, options)
  return response.blob()
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Algo deu errado. Tenta de novo."
