/**
 * linkSchemas.ts - O formato dos links curtos
 * # Pra que serve?
 * - Validar a criação (destino, apelido, título e validade), a edição e os filtros da listagem
 * - Descrever o link que sai da API, já com o endereço curto pronto e o status calculado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"
import { LINK_STATUSES } from "../utils/linkStatus.js"
import { ALIAS_REGEX } from "../utils/slug.js"
import { MAX_TARGET_URL_LENGTH } from "../utils/targetUrl.js"

// Se é URL de verdade e se o protocolo pode, quem confere é o service (pra dar erro com nome próprio)
export const TARGET_URL_SCHEMA = z
  .string()
  .trim()
  .min(1, "Faltou o endereço de destino")
  .max(MAX_TARGET_URL_LENGTH, `Endereço muito longo (máximo ${MAX_TARGET_URL_LENGTH} caracteres)`)

// "Promo-Natal" vira "promo-natal" antes de validar
export const ALIAS_SCHEMA = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .regex(ALIAS_REGEX, "Apelido precisa ter de 3 a 32 caracteres: letras minúsculas, números e hífen no meio")
  )

const TITLE_SCHEMA = z.string().trim().max(120, "Título muito longo (máximo 120 caracteres)")

// Data e hora com fuso, que é o que o navegador manda com toISOString()
const EXPIRES_AT_SCHEMA = z.iso.datetime({
  offset: true,
  error: "Validade precisa ser data e hora ISO (tipo 2026-12-31T23:59:00.000Z)",
})

export const LINK_STATUS_SCHEMA = z.enum(LINK_STATUSES)

export const LINK_ID_PARAMS_SCHEMA = z.object({
  id: z.uuid("id do link inválido"),
})

export const CREATE_LINK_BODY_SCHEMA = z.object({
  target_url: TARGET_URL_SCHEMA,
  // Sem apelido, a API sorteia um slug de 7 caracteres
  alias: ALIAS_SCHEMA.optional(),
  title: TITLE_SCHEMA.nullish(),
  expires_at: EXPIRES_AT_SCHEMA.nullish(),
})

// O slug não muda depois de criado: o link já pode estar impresso num QR code por aí
export const UPDATE_LINK_BODY_SCHEMA = z
  .object({
    target_url: TARGET_URL_SCHEMA,
    title: TITLE_SCHEMA.nullable(),
    active: z.boolean(),
    // null tira a validade
    expires_at: EXPIRES_AT_SCHEMA.nullable(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Manda pelo menos um campo pra alterar")

export const LIST_LINKS_QUERY_SCHEMA = z.object({
  // Procura no slug, no título e no destino
  search: z.string().trim().max(100).optional(),
  status: LINK_STATUS_SCHEMA.optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
})

export const LINK_SCHEMA = z.object({
  id: z.string(),
  slug: z.string(),
  short_url: z.string(),
  target_url: z.string(),
  title: z.string().nullable(),
  active: z.boolean(),
  status: LINK_STATUS_SCHEMA,
  expires_at: z.string().nullable(),
  // Só gente: clique de robô (preview de WhatsApp, crawler) fica de fora
  total_clicks: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const LINK_LIST_RESPONSE_SCHEMA = z.object({
  links: z.array(LINK_SCHEMA),
  total: z.number().int(),
  current_page: z.number().int(),
  total_pages: z.number().int(),
})

export type LinkIdParams = z.infer<typeof LINK_ID_PARAMS_SCHEMA>
export type CreateLinkBody = z.infer<typeof CREATE_LINK_BODY_SCHEMA>
export type UpdateLinkBody = z.infer<typeof UPDATE_LINK_BODY_SCHEMA>
export type ListLinksQuery = z.infer<typeof LIST_LINKS_QUERY_SCHEMA>
