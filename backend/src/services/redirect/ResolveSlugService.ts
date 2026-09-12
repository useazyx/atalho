/**
 * ResolveSlugService.ts - Descobre pra onde um link curto leva
 * # Pra que serve?
 * - Achar o link pelo slug e dizer se ele ainda funciona (existe, está ligado e dentro da validade)
 * - Barrar slug com formato impossível ou reservado sem nem ir no banco
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { getLinkStatus } from "../../utils/linkStatus.js"
import { isReservedSlug } from "../../utils/slug.js"

export const SHORT_LINK_NOT_FOUND = "Link curto não existe"
export const SHORT_LINK_INACTIVE = "Link curto desativado"
export const SHORT_LINK_EXPIRED = "Link curto expirado"

// Slug sorteado (letras e números) ou apelido (minúsculo com hífen); qualquer outra coisa nem existe
const SLUG_PARAM_REGEX = /^[a-zA-Z0-9-]{1,32}$/

export class ResolveSlugService {
  async execute(slug: string, now = new Date()) {
    if (!SLUG_PARAM_REGEX.test(slug) || isReservedSlug(slug)) throw new Error(SHORT_LINK_NOT_FOUND)

    const link = await prisma.link.findUnique({
      where: { slug },
      select: { id: true, target_url: true, active: true, expires_at: true },
    })

    if (!link) throw new Error(SHORT_LINK_NOT_FOUND)

    // Mesma regra da listagem, pra tela e redirect nunca discordarem
    const status = getLinkStatus(link, now)
    if (status === "inactive") throw new Error(SHORT_LINK_INACTIVE)
    if (status === "expired") throw new Error(SHORT_LINK_EXPIRED)

    return { id: link.id, target_url: link.target_url }
  }
}
