const integerFormat = new Intl.NumberFormat("pt-BR")
const compactFormat = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" })
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" })
// Os dias das estatísticas já vêm no fuso certo (AAAA-MM-DD), então formata em UTC pra não andar um dia
const dayFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" })
const dayLongFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })

export const formatNumber = (value: number) => integerFormat.format(value)
export const formatCompact = (value: number) => compactFormat.format(value)
export const formatPercent = (share: number) => percentFormat.format(share)
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso))

const dayToDate = (day: string) => new Date(`${day}T12:00:00.000Z`)
export const formatDay = (day: string) => dayFormat.format(dayToDate(day)).replace(".", "")
export const formatDayLong = (day: string) => dayLongFormat.format(dayToDate(day))

// "http://localhost:3337/github" -> "localhost:3337/github" (o protocolo só ocupa espaço na tela)
export const withoutProtocol = (url: string) => url.replace(/^https?:\/\//, "")

// "https://www.github.com/useazyx" -> "github.com"
export function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "")
  } catch {
    return url
  }
}

export interface Change {
  direction: "up" | "down" | "flat" | "new"
  text: string
}

// Comparação com o período anterior, em palavras (a cor da seta nunca fala sozinha)
export function describeChange(current: number, previous: number, days: number): Change {
  const period = `${days} dias anteriores`
  if (previous === 0) {
    return current === 0
      ? { direction: "flat", text: `Nenhum nos ${period}` }
      : { direction: "new", text: `Nenhum nos ${period}` }
  }

  const change = (current - previous) / previous
  if (Math.abs(change) < 0.005) return { direction: "flat", text: `Igual aos ${period}` }

  const sign = change > 0 ? "+" : "−"
  return {
    direction: change > 0 ? "up" : "down",
    text: `${sign}${percentFormat.format(Math.abs(change))} vs. ${period}`,
  }
}

// input datetime-local trabalha com a hora local sem fuso; a API quer ISO com fuso
export function toDateTimeLocal(iso: string) {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export const fromDateTimeLocal = (value: string) => new Date(value).toISOString()
