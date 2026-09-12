/**
 * GetLinkController.ts - Devolve um link pelo id
 * # Pra que serve?
 * - Buscar o link pra tela de detalhe, só se ele for de quem está logado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import type { LinkIdParams } from "../../schemas/linkSchemas.js"
import { GetLinkService } from "../../services/links/GetLinkService.js"
import { sendLinkError } from "./sendLinkError.js"

export class GetLinkController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as LinkIdParams

    try {
      const getLinkService = new GetLinkService()
      const link = await getLinkService.execute({ userId: req.user.sub, linkId: id })

      return rep.status(200).send(link)
    } catch (error) {
      return sendLinkError(rep, error, "busca de link")
    }
  }
}
