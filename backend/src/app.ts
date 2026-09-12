/**
 * app.ts - Monta a aplicação Fastify com tudo plugado, mas sem abrir porta
 * # Pra que serve?
 * - Criar a instância do Fastify com o Zod cuidando da validação das rotas
 * - Plugar segurança, tratamento de erro, as rotas da API em /api e o redirect dos links na raiz
 * - Ficar separado do server.ts pra os testes conseguirem usar a API sem subir servidor
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 * - v1.1.0 (2026-09-11): Plugin de autenticação (JWT)
 * - v1.2.0 (2026-09-11): Redirect dos links curtos em /:slug
 * - v1.3.0 (2026-09-11): Documentação OpenAPI gerada dos schemas, com a tela em /docs
 */

import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import Fastify from "fastify"
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod"
import { env } from "./config/env.js"
import { prisma } from "./config/prisma.js"
import { errorHandler } from "./errors/errorHandler.js"
import { authPlugin } from "./plugins/auth.js"
import { securityPlugin } from "./plugins/security.js"
import { apiRoutes } from "./routes/apiRoutes.js"
import { redirectRoutes } from "./routes/redirectRoutes.js"

export const API_PREFIX = "/api"
export const DOCS_ROUTE = "/docs"

// O que dá pra ligar/desligar na hora de montar a API
interface BuildAppOptions {
  // Por padrão só fica desligado nos testes
  rateLimit?: boolean
}

// Log bonitinho em desenvolvimento, JSON em produção e silêncio nos testes
const getLoggerConfig = () => {
  if (env.NODE_ENV === "test") return false
  if (env.NODE_ENV === "development") {
    return { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } } }
  }
  return true
}

export async function buildApp({ rateLimit = env.NODE_ENV !== "test" }: BuildAppOptions = {}) {
  // trustProxy: atrás de proxy (Vite em dev, nginx em produção) o IP de verdade vem no X-Forwarded-For
  const app = Fastify({ logger: getLoggerConfig(), trustProxy: true }).withTypeProvider<ZodTypeProvider>()

  // O Zod valida o que entra e formata o que sai
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.setErrorHandler(errorHandler)

  // Rota que não existe também responde no nosso formato (e não no padrão do Fastify)
  app.setNotFoundHandler((req, rep) => {
    rep.status(404).send({
      error: "RouteNotFound",
      message: `A rota ${req.method} ${req.url} não existe`,
    })
  })

  // Segurança antes das rotas, senão o rate limit não enxerga elas
  await app.register(securityPlugin, { rateLimit })
  await app.register(authPlugin)

  // A documentação sai dos mesmos schemas Zod que validam as rotas (não tem como ficar desatualizada)
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Atalho API",
        description: "Encurtador de links com estatísticas de clique (sem guardar IP) e QR code",
        version: "1.0.0",
      },
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      },
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: DOCS_ROUTE })

  await app.register(apiRoutes, { prefix: API_PREFIX })
  // Na raiz: /abc1234. Rota fixa (/api/..., /docs) sempre ganha de rota com parâmetro no Fastify
  await app.register(redirectRoutes)

  // Quando a API desliga, fecha a conexão com o banco também
  app.addHook("onClose", async () => {
    await prisma.$disconnect()
  })

  return app
}
