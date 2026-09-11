/**
 * targetUrl.ts - Confere se um destino pode virar link curto
 * # Pra que serve?
 * - Aceitar só http e https (nada de javascript:, data:, file:)
 * - Não deixar encurtar um link do próprio Atalho (senão dá pra montar um redirect em loop)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

export const MAX_TARGET_URL_LENGTH = 2048

export type TargetUrlProblem = "invalid" | "protocol" | "self" | null

export function checkTargetUrl(value: string, publicBaseUrl: string): TargetUrlProblem {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return "invalid"
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return "protocol"
  if (url.host.toLowerCase() === new URL(publicBaseUrl).host.toLowerCase()) return "self"

  return null
}
