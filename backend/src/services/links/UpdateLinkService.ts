/**
 * UpdateLinkService.ts - Altera um link (destino, título, ativo, validade)
 * # Pra que serve?
 * - Mudar só o que veio no pedido, com as mesmas regras da criação
 * - Nunca mudar o slug (o link curto já pode estar espalhado por aí)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { LINK_SELECT, presentLink } from "./linkPresenter.js"
import { ensureValidTargetUrl, isRecordNotFound, LINK_NOT_FOUND, parseExpiration } from "./linkRules.js"

// O que dá pra mudar (tudo opcional, só vai o que veio):
interface LinkChanges {
  target_url?: string
  title?: string | null
  active?: boolean
  expires_at?: string | null
}

interface UpdateLinkRequest {
  userId: string
  linkId: string
  changes: LinkChanges
}

export class UpdateLinkService {
  async execute({ userId, linkId, changes }: UpdateLinkRequest) {
    await this.ensureLinkBelongsToUser(userId, linkId)

    if (changes.target_url !== undefined) ensureValidTargetUrl(changes.target_url)

    const data = {
      target_url: changes.target_url,
      title: changes.title === undefined ? undefined : changes.title?.trim() || null,
      active: changes.active,
      expires_at: parseExpiration(changes.expires_at),
    }

    try {
      const link = await prisma.link.update({ where: { id: linkId }, data, select: LINK_SELECT })
      return presentLink(link)
    } catch (error) {
      // Apagaram o link entre a checagem e a alteração
      if (isRecordNotFound(error)) throw new Error(LINK_NOT_FOUND)
      throw error
    }
  }

  private async ensureLinkBelongsToUser(userId: string, linkId: string) {
    const link = await prisma.link.findFirst({ where: { id: linkId, user_id: userId }, select: { id: true } })
    if (!link) throw new Error(LINK_NOT_FOUND)
  }
}
