/**
 * timeZone.ts - Em que dia caiu um clique, no fuso de quem olha a estatística
 * # Pra que serve?
 * - Um clique às 23h30 em São Paulo já é dia seguinte em UTC; sem isso o gráfico por dia fica torto
 * - Ser o mesmo "dia" no hash do visitante e na série diária das estatísticas
 * - Fazer conta com dias no formato AAAA-MM-DD (somar dias, listar um período inteiro)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2026-09-12
 * Alterações:
 * - v1.0.0 (2026-09-12): Implementação inicial
 * - v1.1.0 (2026-09-12): addDays e listDays pras estatísticas
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

// "2026-09-11" + 1 -> "2026-09-12". A conta é em UTC pra horário de verão nunca pular nem repetir dia
export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

// Todos os dias de from até to, os dois incluídos (texto AAAA-MM-DD dá pra comparar direto)
export function listDays(from: string, to: string): string[] {
  const days: string[] = []
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day)
  return days
}
