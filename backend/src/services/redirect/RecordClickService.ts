/**
 * RecordClickService.ts - Grava um clique num link curto
 * # Pra que serve?
 * - Transformar a requisição no que a estatística precisa (dispositivo, navegador, origem, idioma)
 * - Contar visitante único com um hash do dia, sem gravar o IP em lugar nenhum
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-12
 * Alterações:
 * - v1.0.0 (2026-09-12): Implementação inicial
 */

import { env } from "../../config/env.js"
import { prisma } from "../../config/prisma.js"
import { parseUserAgent, primaryLanguage, referrerHost, visitorHash } from "../../utils/clickContext.js"
import { localDay } from "../../utils/timeZone.js"

// O que vem da requisição (os cabeçalhos podem não existir, principalmente em robô)
interface RecordClickRequest {
  linkId: string
  ip: string
  userAgent?: string
  referer?: string
  acceptLanguage?: string
  now?: Date
}

export class RecordClickService {
  async execute({ linkId, ip, userAgent, referer, acceptLanguage, now = new Date() }: RecordClickRequest) {
    const { device, browser } = parseUserAgent(userAgent)

    await prisma.click.create({
      data: {
        link_id: linkId,
        clicked_at: now,
        device,
        browser,
        referrer_host: referrerHost(referer),
        language: primaryLanguage(acceptLanguage),
        visitor_hash: visitorHash(ip, userAgent, localDay(now), env.VISITOR_SALT),
      },
    })
  }
}
