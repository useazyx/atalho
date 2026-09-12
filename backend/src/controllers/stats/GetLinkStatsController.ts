/**
 * GetLinkStatsController.ts - Devolve as estatísticas de um link
 * # Pra que serve?
 * - Pegar o link e o período (já validados) e pedir as contas pro service
 * - Link que não é da pessoa responde 404, igual às outras rotas de link
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import type { LinkIdParams } from "../../schemas/linkSchemas.js"
import type { LinkStatsQuery } from "../../schemas/statsSchemas.js"
import { GetLinkStatsService } from "../../services/stats/GetLinkStatsService.js"
import { sendLinkError } from "../links/sendLinkError.js"

export class GetLinkStatsController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as LinkIdParams
    const { days } = req.query as LinkStatsQuery

    try {
      const getLinkStatsService = new GetLinkStatsService()
      const stats = await getLinkStatsService.execute({ userId: req.user.sub, linkId: id, days })

      return rep.status(200).send(stats)
    } catch (error) {
      return sendLinkError(rep, error, "estatísticas do link")
    }
  }
}
