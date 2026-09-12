/**
 * GetLinkQrService.ts - Gera o QR code do link curto
 * # Pra que serve?
 * - Transformar o endereço curto (e não o destino) em QR code: assim o clique pelo QR entra na estatística
 *   e dá pra trocar o destino depois sem reimprimir nada
 * - Entregar em SVG ou PNG, com a margem branca que os leitores de QR precisam
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import QRCode from "qrcode"
import { prisma } from "../../config/prisma.js"
import type { LinkQrQuery } from "../../schemas/qrSchemas.js"
import { buildShortUrl } from "../links/linkPresenter.js"
import { LINK_NOT_FOUND } from "../links/linkRules.js"

// Nível M aguenta uns 15% do código sujo ou amassado, e ainda fica com poucos quadradinhos pra URL curta
const QR_OPTIONS = { errorCorrectionLevel: "M", margin: 2 } as const

interface GetLinkQrRequest extends LinkQrQuery {
  userId: string
  linkId: string
}

export class GetLinkQrService {
  async execute({ userId, linkId, format, size }: GetLinkQrRequest) {
    const link = await prisma.link.findFirst({ where: { id: linkId, user_id: userId }, select: { slug: true } })
    if (!link) throw new Error(LINK_NOT_FOUND)

    const shortUrl = buildShortUrl(link.slug)
    const fileName = `atalho-${link.slug}.${format}`

    if (format === "png") {
      const body = await QRCode.toBuffer(shortUrl, { ...QR_OPTIONS, type: "png", width: size })
      return { contentType: "image/png", fileName, body }
    }

    const body = await QRCode.toString(shortUrl, { ...QR_OPTIONS, type: "svg" })
    return { contentType: "image/svg+xml; charset=utf-8", fileName, body }
  }
}
