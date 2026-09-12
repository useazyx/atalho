/**
 * redirectRoutes.ts - A rota pública dos links curtos, na raiz do domínio
 * # Pra que serve?
 * - GET /:slug leva pro destino (o Fastify cria o HEAD junto, e o controller não conta clique nele)
 * - Fica fora do /api: o link curto tem que ser curto
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { RedirectController } from "../controllers/redirect/RedirectController.js"

// O formato do slug quem confere é o service: slug estranho responde 404, e não 400
const REDIRECT_PARAMS_SCHEMA = z.object({
  slug: z.string(),
})

export const redirectRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/:slug",
    {
      schema: {
        tags: ["Redirect"],
        summary: "Abre o link curto: 302 pro destino, 404 se não existe, 410 se foi desativado ou expirou",
        params: REDIRECT_PARAMS_SCHEMA,
      },
    },
    (req, rep) => new RedirectController().handle(req, rep)
  )
}
