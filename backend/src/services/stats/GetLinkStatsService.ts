/**
 * GetLinkStatsService.ts - As estatísticas de um link num período
 * # Pra que serve?
 * - Contar cliques e visitantes únicos por dia, no fuso de São Paulo, com os dias sem clique zerados
 * - Comparar com o período anterior do mesmo tamanho (subiu ou caiu?)
 * - Rankings de origem, dispositivo, navegador e idioma
 * - Tudo somado no banco (não traz clique por clique pra contar aqui) e robô sempre fora
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-12
 * Alterações:
 * - v1.0.0 (2026-09-12): Implementação inicial
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../../config/prisma.js"
import { addDays, listDays, localDay, STATS_TIME_ZONE } from "../../utils/timeZone.js"
import { LINK_NOT_FOUND } from "../links/linkRules.js"

// Quantos itens cada ranking devolve (o resto é cauda longa que ninguém lê)
const BREAKDOWN_LIMIT = 10

// As colunas que dá pra agrupar. Lista fechada: o nome da coluna entra cru no SQL, então não pode vir de fora
const BREAKDOWN_COLUMNS = {
  referrers: Prisma.raw("referrer_host"),
  devices: Prisma.raw("device::text"),
  browsers: Prisma.raw("browser"),
  languages: Prisma.raw("language"),
}

type BreakdownName = keyof typeof BREAKDOWN_COLUMNS

// O que volta do SQL (os COUNT já vêm convertidos pra int, senão o Postgres manda bigint)
interface DailyRow {
  day: string
  clicks: number
  visitors: number
}

interface BreakdownRow {
  label: string | null
  clicks: number
}

interface PreviousTotalsRow {
  previous_clicks: number
  previous_visitors: number
  bot_clicks: number
}

interface GetLinkStatsRequest {
  userId: string
  linkId: string
  days: number
  now?: Date
}

// Os limites do período já como instantes, calculados no próprio Postgres a partir do dia local
interface PeriodBounds {
  from: Prisma.Sql
  to: Prisma.Sql
  previousFrom: Prisma.Sql
}

export class GetLinkStatsService {
  async execute({ userId, linkId, days, now = new Date() }: GetLinkStatsRequest) {
    await this.ensureLinkBelongsToUser(userId, linkId)

    // Período em dias locais: hoje e os (days - 1) dias antes. O anterior é o bloco do mesmo tamanho logo antes
    const today = localDay(now)
    const fromDay = addDays(today, -(days - 1))
    const bounds: PeriodBounds = {
      from: this.localMidnight(fromDay),
      to: this.localMidnight(addDays(today, 1)),
      previousFrom: this.localMidnight(addDays(fromDay, -days)),
    }

    const [dailyRows, previous, referrers, devices, browsers, languages] = await Promise.all([
      this.countByDay(linkId, bounds),
      this.countPreviousPeriodAndBots(linkId, bounds),
      this.countBy("referrers", linkId, bounds),
      this.countBy("devices", linkId, bounds),
      this.countBy("browsers", linkId, bounds),
      this.countBy("languages", linkId, bounds),
    ])

    const daily = this.fillEmptyDays(dailyRows, fromDay, today)

    return {
      link_id: linkId,
      days,
      time_zone: STATS_TIME_ZONE,
      from: fromDay,
      to: today,
      totals: {
        clicks: daily.reduce((sum, day) => sum + day.clicks, 0),
        // O hash do visitante muda todo dia, então somar os únicos de cada dia é o mesmo que contar no período
        unique_visitors: daily.reduce((sum, day) => sum + day.unique_visitors, 0),
        previous_clicks: previous.previous_clicks,
        previous_unique_visitors: previous.previous_visitors,
        bot_clicks: previous.bot_clicks,
      },
      daily,
      referrers,
      devices,
      browsers,
      languages,
    }
  }

  private async ensureLinkBelongsToUser(userId: string, linkId: string) {
    const link = await prisma.link.findFirst({ where: { id: linkId, user_id: userId }, select: { id: true } })
    if (!link) throw new Error(LINK_NOT_FOUND)
  }

  // Meia-noite do dia no fuso das estatísticas. Comparar clicked_at com instante (e não com dia) usa o índice
  private localMidnight(day: string): Prisma.Sql {
    return Prisma.sql`((${day}::date)::timestamp AT TIME ZONE ${STATS_TIME_ZONE})`
  }

  private countByDay(linkId: string, { from, to }: PeriodBounds) {
    return prisma.$queryRaw<DailyRow[]>`
      SELECT
        to_char(clicked_at AT TIME ZONE ${STATS_TIME_ZONE}, 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS clicks,
        COUNT(DISTINCT visitor_hash)::int AS visitors
      FROM clicks
      WHERE link_id = ${linkId} AND device <> 'BOT' AND clicked_at >= ${from} AND clicked_at < ${to}
      GROUP BY 1
    `
  }

  // Uma passada só pro período anterior e pros robôs do período atual
  private async countPreviousPeriodAndBots(linkId: string, { from, to, previousFrom }: PeriodBounds) {
    const [row] = await prisma.$queryRaw<PreviousTotalsRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE device <> 'BOT' AND clicked_at < ${from})::int AS previous_clicks,
        COUNT(DISTINCT visitor_hash) FILTER (WHERE device <> 'BOT' AND clicked_at < ${from})::int AS previous_visitors,
        COUNT(*) FILTER (WHERE device = 'BOT' AND clicked_at >= ${from})::int AS bot_clicks
      FROM clicks
      WHERE link_id = ${linkId} AND clicked_at >= ${previousFrom} AND clicked_at < ${to}
    `

    return row
  }

  private countBy(name: BreakdownName, linkId: string, { from, to }: PeriodBounds) {
    const column = BREAKDOWN_COLUMNS[name]

    // Empate no número de cliques: ordem alfabética, pra resposta não mudar de uma chamada pra outra
    return prisma.$queryRaw<BreakdownRow[]>`
      SELECT ${column} AS label, COUNT(*)::int AS clicks
      FROM clicks
      WHERE link_id = ${linkId} AND device <> 'BOT' AND clicked_at >= ${from} AND clicked_at < ${to}
      GROUP BY 1
      ORDER BY clicks DESC, label ASC NULLS FIRST
      LIMIT ${BREAKDOWN_LIMIT}
    `
  }

  // O banco só devolve dia que teve clique; o gráfico precisa de todos
  private fillEmptyDays(rows: DailyRow[], fromDay: string, today: string) {
    const rowsByDay = new Map(rows.map((row) => [row.day, row]))

    return listDays(fromDay, today).map((date) => ({
      date,
      clicks: rowsByDay.get(date)?.clicks ?? 0,
      unique_visitors: rowsByDay.get(date)?.visitors ?? 0,
    }))
  }
}
