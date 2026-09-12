/**
 * linkStatus.ts - Diz em que situação um link está agora
 * # Pra que serve?
 * - Juntar "ativo" e "validade" numa resposta só: active, inactive ou expired
 * - Ser a mesma regra no redirect, na listagem e no filtro (pra tela e redirect nunca discordarem)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

export type LinkStatus = "active" | "inactive" | "expired"

export const LINK_STATUSES = ["active", "inactive", "expired"] as const

// Desativado ganha de expirado: foi a pessoa que desligou, é isso que ela quer ver
export function getLinkStatus(link: { active: boolean; expires_at: Date | null }, now = new Date()): LinkStatus {
  if (!link.active) return "inactive"
  if (link.expires_at && link.expires_at <= now) return "expired"
  return "active"
}
