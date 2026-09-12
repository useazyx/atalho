/**
 * linkRules.ts - As regras de negócio que a criação e a edição de link dividem
 * # Pra que serve?
 * - Guardar as mensagens de erro dos links num lugar só (o controller compara com as mesmas constantes)
 * - Conferir o destino (URL válida, http/https, não apontar pro próprio Atalho)
 * - Conferir a validade (tem que estar no futuro)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { Prisma } from "@prisma/client"
import { env } from "../../config/env.js"
import { checkTargetUrl } from "../../utils/targetUrl.js"

export const LINK_NOT_FOUND = "Link não encontrado"
export const INVALID_TARGET_URL = "Endereço de destino inválido"
export const TARGET_PROTOCOL_NOT_ALLOWED = "Destino precisa ser http ou https"
export const TARGET_IS_SHORT_LINK = "Destino aponta pro próprio Atalho"
export const ALIAS_RESERVED = "Apelido reservado"
export const ALIAS_TAKEN = "Apelido já em uso"
export const EXPIRATION_IN_PAST = "Validade no passado"

const TARGET_URL_ERRORS = {
  invalid: INVALID_TARGET_URL,
  protocol: TARGET_PROTOCOL_NOT_ALLOWED,
  self: TARGET_IS_SHORT_LINK,
} as const

export function ensureValidTargetUrl(targetUrl: string) {
  const problem = checkTargetUrl(targetUrl, env.PUBLIC_BASE_URL)
  if (problem) throw new Error(TARGET_URL_ERRORS[problem])
}

// undefined = não mexe; null = sem validade; texto = data que precisa estar no futuro
export function parseExpiration(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value

  const expiresAt = new Date(value)
  if (expiresAt <= new Date()) throw new Error(EXPIRATION_IN_PAST)

  return expiresAt
}

// P2002 = o índice único do banco barrou (slug repetido)
export const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"

// P2025 = o registro sumiu entre a checagem e a alteração
export const isRecordNotFound = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
