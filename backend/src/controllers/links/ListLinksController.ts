/**
 * ListLinksController.ts - Devolve a lista de links de quem está logado
 * # Pra que serve?
 * - Repassar os filtros (já validados e com os padrões preenchidos) pro service
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { ListLinksQuery } from "../../schemas/linkSchemas.js"
import { ListLinksService } from "../../services/links/ListLinksService.js"

export class ListLinksController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const query = req.query as ListLinksQuery

    try {
      const listLinksService = new ListLinksService()
      const result = await listLinksService.execute({ userId: req.user.sub, ...query })

      return rep.status(200).send(result)
    } catch (error) {
      return sendUnexpectedError(rep, error, "listagem de links")
    }
  }
}
