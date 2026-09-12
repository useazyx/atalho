/**
 * DeleteLinkController.ts - Apaga um link
 * # Pra que serve?
 * - Apagar o link (e as estatísticas dele) e responder 204, sem corpo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import type { LinkIdParams } from "../../schemas/linkSchemas.js"
import { DeleteLinkService } from "../../services/links/DeleteLinkService.js"
import { sendLinkError } from "./sendLinkError.js"

export class DeleteLinkController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as LinkIdParams

    try {
      const deleteLinkService = new DeleteLinkService()
      await deleteLinkService.execute({ userId: req.user.sub, linkId: id })

      return rep.status(204).send()
    } catch (error) {
      return sendLinkError(rep, error, "exclusão de link")
    }
  }
}
