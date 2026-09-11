/**
 * security.ts - As proteções básicas que toda API pública precisa
 * # Pra que serve?
 * - helmet: cabeçalhos de segurança
 * - cors: quais sites podem chamar a API pelo navegador (o front do Atalho roda em outra porta)
 * - rate limit: segura quem manda requisição demais (e mais ainda no login e na criação de link)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import fp from "fastify-plugin"
import { env } from "../config/env.js"

// Limite geral por IP; login, cadastro e criação de link têm limites próprios, mais apertados
const GLOBAL_RATE_LIMIT = { max: 300, timeWindow: "1 minute" }
export const AUTH_RATE_LIMIT = { max: 10, timeWindow: "1 minute" }
export const CREATE_LINK_RATE_LIMIT = { max: 30, timeWindow: "1 minute" }

interface SecurityPluginOptions {
  rateLimit: boolean
}

export const securityPlugin = fp<SecurityPluginOptions>(async (app, options) => {
  // CSP desligado porque a API só devolve JSON (e a página de docs precisa de script inline)
  await app.register(helmet, { contentSecurityPolicy: false })

  await app.register(cors, { origin: env.CORS_ORIGINS, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] })

  // Nos testes vem desligado, senão todo mundo (mesmo IP) estoura o limite
  if (!options.rateLimit) return

  await app.register(rateLimit, {
    ...GLOBAL_RATE_LIMIT,
    // Vira erro com statusCode, e o errorHandler responde no formato { error, message }
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      code: "TooManyRequests",
      message: `Muitas requisições. Espera ${Math.ceil(context.ttl / 1000)} segundos e tenta de novo`,
    }),
  })
})
