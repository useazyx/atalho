/**
 * GetLinkService.ts - Busca um link da própria pessoa
 * # Pra que serve?
 * - Trazer o link pelo id, só se ele for de quem pediu
 * - Link de outra pessoa responde igual a link que não existe (pra ninguém ficar testando id)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { LINK_SELECT, presentLink } from "./linkPresenter.js"
import { LINK_NOT_FOUND } from "./linkRules.js"

// O que a gente precisa pra achar o link:
interface GetLinkRequest {
  userId: string
  linkId: string
}

export class GetLinkService {
  async execute({ userId, linkId }: GetLinkRequest) {
    const link = await prisma.link.findFirst({ where: { id: linkId, user_id: userId }, select: LINK_SELECT })

    if (!link) throw new Error(LINK_NOT_FOUND)

    return presentLink(link)
  }
}
