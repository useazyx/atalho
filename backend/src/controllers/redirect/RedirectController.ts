/**
 * RedirectController.ts - O coração do Atalho: abre /abc1234 e manda pro destino
 * # Pra que serve?
 * - Responder 302 pro destino e gravar o clique sem fazer a pessoa esperar o banco
 * - HEAD não conta clique (é verificador de link, não gente abrindo)
 * - Link que não funciona: página legível no navegador, JSON pra quem pediu JSON
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import { RecordClickService } from "../../services/redirect/RecordClickService.js"
import {
  ResolveSlugService,
  SHORT_LINK_EXPIRED,
  SHORT_LINK_INACTIVE,
  SHORT_LINK_NOT_FOUND,
} from "../../services/redirect/ResolveSlugService.js"
import { type DeadLinkReason, renderDeadLinkPage } from "../../utils/deadLinkPage.js"

interface RedirectParams {
  slug: string
}

export class RedirectController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { slug } = req.params as RedirectParams

    try {
      const resolveSlugService = new ResolveSlugService()
      const link = await resolveSlugService.execute(slug)

      if (req.method !== "HEAD") this.recordClickInBackground(req, link.id)

      // no-store: se o navegador guardar o redirect, o próximo clique nem chega aqui (e some da estatística)
      return rep.header("Cache-Control", "private, no-store").redirect(link.target_url, 302)
    } catch (error) {
      return this.handleServiceError(error, req, rep)
    }
  }

  // Sem await de propósito: se o banco demorar, quem clicou não fica olhando tela branca
  private recordClickInBackground(req: FastifyRequest, linkId: string) {
    const recordClickService = new RecordClickService()

    recordClickService
      .execute({
        linkId,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        referer: req.headers.referer,
        acceptLanguage: req.headers["accept-language"],
      })
      .catch((error) => req.log.error(error, "Deu ruim: gravar clique"))
  }

  private handleServiceError(error: unknown, req: FastifyRequest, rep: FastifyReply) {
    const errorMappings = [
      {
        message: SHORT_LINK_NOT_FOUND,
        handler: () => this.sendDeadLink(req, rep, 404, "not-found", "LinkNotFound", "Esse link curto não existe"),
      },
      {
        message: SHORT_LINK_INACTIVE,
        handler: () => this.sendDeadLink(req, rep, 410, "inactive", "LinkInactive", "Esse link curto foi desativado"),
      },
      {
        message: SHORT_LINK_EXPIRED,
        handler: () => this.sendDeadLink(req, rep, 410, "expired", "LinkExpired", "Esse link curto expirou"),
      },
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "redirect")
  }

  // Navegador pede text/html; fetch, curl e afins ficam com o JSON de sempre
  private sendDeadLink(
    req: FastifyRequest,
    rep: FastifyReply,
    statusCode: 404 | 410,
    reason: DeadLinkReason,
    errorCode: string,
    message: string
  ) {
    rep.status(statusCode).header("Cache-Control", "no-store")

    if (req.headers.accept?.includes("text/html")) {
      return rep.type("text/html; charset=utf-8").send(renderDeadLinkPage(reason))
    }

    return rep.send({ error: errorCode, message })
  }
}
