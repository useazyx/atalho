/**
 * linkPresenter.ts - Como um link sai da API
 * # Pra que serve?
 * - Definir os campos que a gente busca (com a contagem de cliques junto, numa consulta só)
 * - Montar o endereço curto, calcular o status e converter as datas pra texto ISO
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { Prisma } from "@prisma/client"
import { env } from "../../config/env.js"
import { getLinkStatus } from "../../utils/linkStatus.js"

// Robô não é gente: preview de WhatsApp e crawler não entram na conta de cliques
export const HUMAN_CLICKS_FILTER = { device: { not: "BOT" } } satisfies Prisma.ClickWhereInput

export const LINK_SELECT = {
  id: true,
  slug: true,
  target_url: true,
  title: true,
  active: true,
  expires_at: true,
  created_at: true,
  updated_at: true,
  _count: { select: { clicks: { where: HUMAN_CLICKS_FILTER } } },
} satisfies Prisma.LinkSelect

type LinkWithClickCount = Prisma.LinkGetPayload<{ select: typeof LINK_SELECT }>

export const buildShortUrl = (slug: string): string => `${env.PUBLIC_BASE_URL}/${slug}`

export function presentLink(link: LinkWithClickCount, now = new Date()) {
  const { _count, ...fields } = link

  return {
    ...fields,
    short_url: buildShortUrl(link.slug),
    status: getLinkStatus(link, now),
    expires_at: link.expires_at?.toISOString() ?? null,
    total_clicks: _count.clicks,
    created_at: link.created_at.toISOString(),
    updated_at: link.updated_at.toISOString(),
  }
}
