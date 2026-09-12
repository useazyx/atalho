/**
 * timeZone.ts - Em que dia caiu um clique, no fuso de quem olha a estatística
 * # Pra que serve?
 * - Um clique às 23h30 em São Paulo já é dia seguinte em UTC; sem isso o gráfico por dia fica torto
 * - Ser o mesmo "dia" no hash do visitante e na série diária das estatísticas
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-12
 * Alterações:
 * - v1.0.0 (2026-09-12): Implementação inicial
 */

export const STATS_TIME_ZONE = "America/Sao_Paulo"

// en-CA formata como AAAA-MM-DD, que é justamente o formato que a gente quer
const dayFormatters = new Map<string, Intl.DateTimeFormat>()

export function localDay(date: Date, timeZone = STATS_TIME_ZONE): string {
  let formatter = dayFormatters.get(timeZone)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    dayFormatters.set(timeZone, formatter)
  }

  return formatter.format(date)
}
