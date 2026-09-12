/**
 * sendLinkError.ts - Traduz os erros dos services de link pra resposta HTTP
 * # Pra que serve?
 * - Criar, editar, buscar e apagar link dão os mesmos erros, então a tradução fica num lugar só
 * - Erro que não está na lista vira o 500 genérico (sem vazar detalhe)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import {
  ALIAS_RESERVED,
  ALIAS_TAKEN,
  EXPIRATION_IN_PAST,
  INVALID_TARGET_URL,
  LINK_NOT_FOUND,
  TARGET_IS_SHORT_LINK,
  TARGET_PROTOCOL_NOT_ALLOWED,
} from "../../services/links/linkRules.js"

export function sendLinkError(rep: FastifyReply, error: unknown, context: string) {
  const errorMappings = [
    {
      message: LINK_NOT_FOUND,
      handler: () => rep.status(404).send({ error: "LinkNotFound", message: "Link não encontrado" }),
    },
    {
      message: INVALID_TARGET_URL,
      handler: () =>
        rep.status(400).send({
          error: "InvalidTargetUrl",
          message: "Esse destino não é um endereço válido (tipo https://seusite.com/pagina)",
        }),
    },
    {
      message: TARGET_PROTOCOL_NOT_ALLOWED,
      handler: () =>
        rep.status(400).send({
          error: "TargetProtocolNotAllowed",
          message: "Só dá pra encurtar endereço que começa com http:// ou https://",
        }),
    },
    {
      message: TARGET_IS_SHORT_LINK,
      handler: () =>
        rep.status(400).send({
          error: "TargetIsShortLink",
          message: "Não dá pra encurtar um link do próprio Atalho (ia virar redirect em loop)",
        }),
    },
    {
      message: ALIAS_RESERVED,
      handler: () =>
        rep.status(400).send({ error: "AliasReserved", message: "Esse apelido é usado pelo próprio Atalho, escolhe outro" }),
    },
    {
      message: ALIAS_TAKEN,
      handler: () => rep.status(409).send({ error: "AliasTaken", message: "Esse apelido já está em uso, escolhe outro" }),
    },
    {
      message: EXPIRATION_IN_PAST,
      handler: () =>
        rep.status(400).send({ error: "ExpirationInPast", message: "A data de validade precisa estar no futuro" }),
    },
  ]

  const message = error instanceof Error ? error.message : ""
  const mapping = errorMappings.find((item) => item.message === message)
  if (mapping) return mapping.handler()

  return sendUnexpectedError(rep, error, context)
}
