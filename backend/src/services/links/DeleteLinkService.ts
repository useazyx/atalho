/**
 * DeleteLinkService.ts - Apaga um link (e os cliques dele junto)
 * # Pra que serve?
 * - Apagar só se o link for de quem pediu, numa operação só (sem buscar antes)
 * - Os cliques somem junto por causa do CASCADE no banco
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { LINK_NOT_FOUND } from "./linkRules.js"

// O que a gente precisa pra apagar:
interface DeleteLinkRequest {
  userId: string
  linkId: string
}

export class DeleteLinkService {
  async execute({ userId, linkId }: DeleteLinkRequest) {
    // deleteMany com o dono no filtro: se não apagou nada, ou não existe ou não é dela
    const { count } = await prisma.link.deleteMany({ where: { id: linkId, user_id: userId } })

    if (count === 0) throw new Error(LINK_NOT_FOUND)
  }
}
