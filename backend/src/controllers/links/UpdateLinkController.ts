/**
 * UpdateLinkController.ts - Recebe as alterações de um link
 * # Pra que serve?
 * - Mandar pro service só o que veio no corpo (o resto do link fica como está)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import type { LinkIdParams, UpdateLinkBody } from "../../schemas/linkSchemas.js"
import { UpdateLinkService } from "../../services/links/UpdateLinkService.js"
import { sendLinkError } from "./sendLinkError.js"

export class UpdateLinkController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as LinkIdParams
    const changes = req.body as UpdateLinkBody

    try {
      const updateLinkService = new UpdateLinkService()
      const link = await updateLinkService.execute({ userId: req.user.sub, linkId: id, changes })

      return rep.status(200).send(link)
    } catch (error) {
      return sendLinkError(rep, error, "alteração de link")
    }
  }
}
