/**
 * CreateLinkController.ts - Recebe o pedido de link curto novo
 * # Pra que serve?
 * - Pegar o corpo já validado pelo schema e criar o link no nome de quem está logado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import type { CreateLinkBody } from "../../schemas/linkSchemas.js"
import { CreateLinkService } from "../../services/links/CreateLinkService.js"
import { sendLinkError } from "./sendLinkError.js"

export class CreateLinkController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const body = req.body as CreateLinkBody

    try {
      const createLinkService = new CreateLinkService()
      const link = await createLinkService.execute({ userId: req.user.sub, ...body })

      return rep.status(201).send(link)
    } catch (error) {
      return sendLinkError(rep, error, "criação de link")
    }
  }
}
