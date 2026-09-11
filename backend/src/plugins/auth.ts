/**
 * auth.ts - O porteiro da API
 * # Pra que serve?
 * - Configurar o JWT com o segredo e a validade do .env
 * - authenticate: só deixa passar quem tem token válido (cada um só vê os próprios links)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import fastifyJwt from "@fastify/jwt"
import type { FastifyReply, FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { env } from "../config/env.js"

// fastify-plugin pra o decorator valer na API toda (e não só dentro deste plugin)
export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  })

  // O porteiro: confere o token do header Authorization
  app.decorate("authenticate", async (req: FastifyRequest, rep: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      return rep.status(401).send({
        error: "Unauthorized",
        message: "Precisa estar logado pra isso (token ausente, inválido ou vencido)",
      })
    }
  })
})
