import { ApiError, errorMessage } from "./api"

// As regras que criar e editar link dividem

export type LinkField = "target_url" | "alias" | "title" | "expires_at"
export type LinkFieldErrors = Partial<Record<LinkField, string>>

// Erros da API que têm dono aparecem embaixo do campo certo, e não num aviso solto
const FIELD_BY_ERROR_CODE: Record<string, LinkField> = {
  InvalidTargetUrl: "target_url",
  TargetProtocolNotAllowed: "target_url",
  TargetIsShortLink: "target_url",
  AliasReserved: "alias",
  AliasTaken: "alias",
  ExpirationInPast: "expires_at",
}

// Quem cola "github.com/useazyx" quer dizer https://github.com/useazyx
export function normalizeTargetUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed || /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || /^(javascript|data|mailto):/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export const isInFuture = (dateTimeLocal: string) => new Date(dateTimeLocal) > new Date()

// Ou o erro vira erro de campo, ou vira uma mensagem geral
export function readLinkError(error: unknown): { fields: LinkFieldErrors; message: string | null } {
  if (!(error instanceof ApiError)) return { fields: {}, message: errorMessage(error) }

  const field = FIELD_BY_ERROR_CODE[error.code]
  if (field) return { fields: { [field]: error.message }, message: null }

  // Issue do Zod no backend vem como "body.alias"
  if (error.code === "ValidationError" && error.issues?.length) {
    const fields = Object.fromEntries(error.issues.map((issue) => [issue.field.replace(/^body\./, ""), issue.message]))
    return { fields, message: null }
  }

  return { fields: {}, message: error.message }
}
