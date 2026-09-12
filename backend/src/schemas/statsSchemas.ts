/**
 * statsSchemas.ts - O formato das estatísticas de um link
 * # Pra que serve?
 * - Validar o período pedido (quantos dias pra trás, contando hoje)
 * - Descrever o que sai: totais, comparação com o período anterior, série por dia e os rankings
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-12
 * Alterações:
 * - v1.0.0 (2026-09-12): Implementação inicial
 */

import { z } from "zod"

export const MAX_STATS_DAYS = 365

export const LINK_STATS_QUERY_SCHEMA = z.object({
  days: z.coerce
    .number()
    .int()
    .min(1, "O período precisa ter pelo menos 1 dia")
    .max(MAX_STATS_DAYS, `O período vai até ${MAX_STATS_DAYS} dias`)
    .default(30),
})

// label null = não veio a informação (sem referrer é acesso direto, sem idioma é navegador que não mandou)
const BREAKDOWN_SCHEMA = z.array(
  z.object({
    label: z.string().nullable(),
    clicks: z.number().int(),
  })
)

export const LINK_STATS_SCHEMA = z.object({
  link_id: z.string(),
  days: z.number().int(),
  time_zone: z.string(),
  // Dias locais (AAAA-MM-DD), os dois incluídos
  from: z.string(),
  to: z.string(),
  totals: z.object({
    clicks: z.number().int(),
    unique_visitors: z.number().int(),
    previous_clicks: z.number().int(),
    previous_unique_visitors: z.number().int(),
    // Robô não entra em nenhum outro número, mas vale mostrar quantos foram barrados
    bot_clicks: z.number().int(),
  }),
  daily: z.array(
    z.object({
      date: z.string(),
      clicks: z.number().int(),
      unique_visitors: z.number().int(),
    })
  ),
  referrers: BREAKDOWN_SCHEMA,
  devices: BREAKDOWN_SCHEMA,
  browsers: BREAKDOWN_SCHEMA,
  languages: BREAKDOWN_SCHEMA,
})

export type LinkStatsQuery = z.infer<typeof LINK_STATS_QUERY_SCHEMA>
