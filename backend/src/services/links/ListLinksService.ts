/**
 * ListLinksService.ts - Lista os links de quem está logado
 * # Pra que serve?
 * - Trazer só os links da própria pessoa, do mais novo pro mais antigo, com paginação
 * - Filtrar por texto (slug, título ou destino) e por status (ativo, desativado, expirado)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { Prisma } from "@prisma/client"
import { prisma } from "../../config/prisma.js"
import type { LinkStatus } from "../../utils/linkStatus.js"
import { LINK_SELECT, presentLink } from "./linkPresenter.js"

// O que a gente precisa pra fazer a busca:
interface ListLinksRequest {
  userId: string
  search?: string
  status?: LinkStatus
  page: number
  page_size: number
}

export class ListLinksService {
  async execute({ userId, search, status, page, page_size }: ListLinksRequest) {
    // O mesmo "agora" pro filtro e pro status de cada link (senão um link pode expirar no meio da resposta)
    const now = new Date()
    const where = this.buildWhereClause(userId, search, status, now)

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where,
        select: LINK_SELECT,
        // id desempata links criados no mesmo milissegundo (senão a paginação pode repetir um)
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.link.count({ where }),
    ])

    return {
      links: links.map((link) => presentLink(link, now)),
      total,
      current_page: page,
      total_pages: Math.max(1, Math.ceil(total / page_size)),
    }
  }

  private buildWhereClause(userId: string, search: string | undefined, status: LinkStatus | undefined, now: Date) {
    const conditions: Prisma.LinkWhereInput[] = [{ user_id: userId }]

    if (search) {
      conditions.push({
        OR: [
          { slug: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { target_url: { contains: search, mode: "insensitive" } },
        ],
      })
    }

    // Mesma regra do getLinkStatus: desativado ganha de expirado
    if (status === "inactive") conditions.push({ active: false })
    if (status === "expired") conditions.push({ active: true, expires_at: { lte: now } })
    if (status === "active") {
      conditions.push({ active: true, OR: [{ expires_at: null }, { expires_at: { gt: now } }] })
    }

    return { AND: conditions } satisfies Prisma.LinkWhereInput
  }
}
