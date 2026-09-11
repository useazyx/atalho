/**
 * fastify.d.ts - Ensina pro TypeScript o que a gente pendurou no Fastify
 * # Pra que serve?
 * - Dizer o formato do token (só o id do usuário)
 * - Tipar o porteiro (authenticate)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import "@fastify/jwt"
import type { FastifyReply, FastifyRequest } from "fastify"

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string }
    user: { sub: string }
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, rep: FastifyReply) => Promise<void>
  }
}
