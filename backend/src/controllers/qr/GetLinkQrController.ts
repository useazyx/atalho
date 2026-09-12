/**
 * GetLinkQrController.ts - Devolve a imagem do QR code de um link
 * # Pra que serve?
 * - Responder com a imagem em si (e não JSON), já com o nome de arquivo sugerido pra quem for baixar
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-12
 * Alterações:
 * - v1.0.0 (2026-09-12): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import type { LinkIdParams } from "../../schemas/linkSchemas.js"
import type { LinkQrQuery } from "../../schemas/qrSchemas.js"
import { GetLinkQrService } from "../../services/qr/GetLinkQrService.js"
import { sendLinkError } from "../links/sendLinkError.js"

export class GetLinkQrController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as LinkIdParams
    const query = req.query as LinkQrQuery

    try {
      const getLinkQrService = new GetLinkQrService()
      const qr = await getLinkQrService.execute({ userId: req.user.sub, linkId: id, ...query })

      // O slug nunca muda, então o QR de um link é sempre o mesmo: dá pra deixar o navegador guardar um pouco
      return rep
        .status(200)
        .type(qr.contentType)
        .header("Cache-Control", "private, max-age=3600")
        .header("Content-Disposition", `inline; filename="${qr.fileName}"`)
        .send(qr.body)
    } catch (error) {
      return sendLinkError(rep, error, "QR code do link")
    }
  }
}
