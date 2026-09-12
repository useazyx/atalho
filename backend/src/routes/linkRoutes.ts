/**
 * linkRoutes.ts - As rotas dos links curtos (todas privadas)
 * # Pra que serve?
 * - Criar, listar, buscar, alterar e apagar links de quem está logado
 * - Criação com rate limit próprio (contra quem quer usar o Atalho pra espalhar spam)
 * - Estatísticas e QR code de cada link
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2026-09-12
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 * - v1.1.0 (2026-09-12): GET /:id/stats
 * - v1.2.0 (2026-09-12): GET /:id/qr
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { CreateLinkController } from "../controllers/links/CreateLinkController.js"
import { DeleteLinkController } from "../controllers/links/DeleteLinkController.js"
import { GetLinkController } from "../controllers/links/GetLinkController.js"
import { ListLinksController } from "../controllers/links/ListLinksController.js"
import { UpdateLinkController } from "../controllers/links/UpdateLinkController.js"
import { GetLinkQrController } from "../controllers/qr/GetLinkQrController.js"
import { GetLinkStatsController } from "../controllers/stats/GetLinkStatsController.js"
import { CREATE_LINK_RATE_LIMIT } from "../plugins/security.js"
import {
  CREATE_LINK_BODY_SCHEMA,
  LINK_ID_PARAMS_SCHEMA,
  LINK_LIST_RESPONSE_SCHEMA,
  LINK_SCHEMA,
  LIST_LINKS_QUERY_SCHEMA,
  UPDATE_LINK_BODY_SCHEMA,
} from "../schemas/linkSchemas.js"
import { LINK_QR_QUERY_SCHEMA } from "../schemas/qrSchemas.js"
import { LINK_STATS_QUERY_SCHEMA, LINK_STATS_SCHEMA } from "../schemas/statsSchemas.js"

const TAGS = ["Links"]
const SECURITY = [{ bearerAuth: [] }]

export const linkRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- Rotas privadas: todas daqui passam pelo porteiro ----------
  app.addHook("onRequest", app.authenticate)

  app.post(
    "/",
    {
      config: { rateLimit: CREATE_LINK_RATE_LIMIT },
      schema: {
        tags: TAGS,
        summary: "Cria um link curto (com apelido ou slug sorteado)",
        security: SECURITY,
        body: CREATE_LINK_BODY_SCHEMA,
        response: { 201: LINK_SCHEMA },
      },
    },
    (req, rep) => new CreateLinkController().handle(req, rep)
  )

  app.get(
    "/",
    {
      schema: {
        tags: TAGS,
        summary: "Lista os meus links, do mais novo pro mais antigo",
        security: SECURITY,
        querystring: LIST_LINKS_QUERY_SCHEMA,
        response: { 200: LINK_LIST_RESPONSE_SCHEMA },
      },
    },
    (req, rep) => new ListLinksController().handle(req, rep)
  )

  app.get(
    "/:id",
    {
      schema: {
        tags: TAGS,
        summary: "Busca um link meu",
        security: SECURITY,
        params: LINK_ID_PARAMS_SCHEMA,
        response: { 200: LINK_SCHEMA },
      },
    },
    (req, rep) => new GetLinkController().handle(req, rep)
  )

  app.get(
    "/:id/stats",
    {
      schema: {
        tags: TAGS,
        summary: "Cliques por dia, visitantes únicos e rankings do link (sem robôs, fuso de São Paulo)",
        security: SECURITY,
        params: LINK_ID_PARAMS_SCHEMA,
        querystring: LINK_STATS_QUERY_SCHEMA,
        response: { 200: LINK_STATS_SCHEMA },
      },
    },
    (req, rep) => new GetLinkStatsController().handle(req, rep)
  )

  app.get(
    "/:id/qr",
    {
      schema: {
        tags: TAGS,
        summary: "QR code do endereço curto, em SVG (padrão) ou PNG",
        security: SECURITY,
        params: LINK_ID_PARAMS_SCHEMA,
        querystring: LINK_QR_QUERY_SCHEMA,
      },
    },
    (req, rep) => new GetLinkQrController().handle(req, rep)
  )

  app.patch(
    "/:id",
    {
      schema: {
        tags: TAGS,
        summary: "Altera destino, título, validade ou liga/desliga o link (o slug não muda)",
        security: SECURITY,
        params: LINK_ID_PARAMS_SCHEMA,
        body: UPDATE_LINK_BODY_SCHEMA,
        response: { 200: LINK_SCHEMA },
      },
    },
    (req, rep) => new UpdateLinkController().handle(req, rep)
  )

  app.delete(
    "/:id",
    {
      schema: {
        tags: TAGS,
        summary: "Apaga o link e as estatísticas dele (responde 204)",
        security: SECURITY,
        params: LINK_ID_PARAMS_SCHEMA,
      },
    },
    (req, rep) => new DeleteLinkController().handle(req, rep)
  )
}
