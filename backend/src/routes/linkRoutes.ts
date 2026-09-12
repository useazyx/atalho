/**
 * linkRoutes.ts - As rotas dos links curtos (todas privadas)
 * # Pra que serve?
 * - Criar, listar, buscar, alterar e apagar links de quem está logado
 * - Criação com rate limit próprio (contra quem quer usar o Atalho pra espalhar spam)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { CreateLinkController } from "../controllers/links/CreateLinkController.js"
import { DeleteLinkController } from "../controllers/links/DeleteLinkController.js"
import { GetLinkController } from "../controllers/links/GetLinkController.js"
import { ListLinksController } from "../controllers/links/ListLinksController.js"
import { UpdateLinkController } from "../controllers/links/UpdateLinkController.js"
import { CREATE_LINK_RATE_LIMIT } from "../plugins/security.js"
import {
  CREATE_LINK_BODY_SCHEMA,
  LINK_ID_PARAMS_SCHEMA,
  LINK_LIST_RESPONSE_SCHEMA,
  LINK_SCHEMA,
  LIST_LINKS_QUERY_SCHEMA,
  UPDATE_LINK_BODY_SCHEMA,
} from "../schemas/linkSchemas.js"

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
