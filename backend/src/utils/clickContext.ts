/**
 * clickContext.ts - Tira de uma requisição o que a estatística do clique precisa
 * # Pra que serve?
 * - Dizer se veio de computador, celular, tablet ou robô (preview do WhatsApp, crawler...)
 * - Identificar o navegador pela família (Chrome, Safari, Firefox, Edge...)
 * - Pegar só o domínio de quem mandou o link e o idioma principal do navegador
 * - Montar o hash do visitante: IP + navegador + dia + sal, sem guardar o IP
 * - Classificação simples de propósito: não precisa de lista gigante de user-agent pra estatística
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { createHash } from "node:crypto"

export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "BOT" | "UNKNOWN"

const BOT_PATTERN =
  /bot|crawler|spider|crawling|preview|facebookexternalhit|slurp|whatsapp|telegram|discord|curl|wget|python-requests|headless|monitor/i
const TABLET_PATTERN = /ipad|tablet|kindle|silk|android(?!.*mobile)/i
const MOBILE_PATTERN = /mobile|iphone|ipod|windows phone|opera mini/i

// A ordem importa: Edge e Opera também dizem "Chrome" no user-agent, e Chrome também diz "Safari"
const BROWSER_PATTERNS: [RegExp, string][] = [
  [/edg(e|a|ios)?\//i, "Edge"],
  [/opr\/|opera/i, "Opera"],
  [/samsungbrowser/i, "Samsung Internet"],
  [/firefox|fxios/i, "Firefox"],
  [/chrome|crios|chromium/i, "Chrome"],
  [/safari/i, "Safari"],
]

export function parseUserAgent(userAgent: string | undefined): { device: DeviceType; browser: string } {
  if (!userAgent) return { device: "UNKNOWN", browser: "Desconhecido" }
  if (BOT_PATTERN.test(userAgent)) return { device: "BOT", browser: "Robô" }

  const device: DeviceType = TABLET_PATTERN.test(userAgent)
    ? "TABLET"
    : MOBILE_PATTERN.test(userAgent)
      ? "MOBILE"
      : "DESKTOP"

  const browser = BROWSER_PATTERNS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Outro"

  return { device, browser }
}

// "https://www.instagram.com/p/abc" -> "instagram.com"; lixo ou vazio -> null (acesso direto)
export function referrerHost(referer: string | undefined): string | null {
  if (!referer) return null
  try {
    const host = new URL(referer).hostname.toLowerCase()
    return host.replace(/^www\./, "") || null
  } catch {
    return null
  }
}

// "pt-BR,pt;q=0.9,en;q=0.8" -> "pt-BR"
export function primaryLanguage(acceptLanguage: string | undefined): string | null {
  const first = acceptLanguage?.split(",")[0]?.split(";")[0]?.trim()
  if (!first || first === "*") return null

  const [language, region] = first.split("-")
  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase()
}

// Mesmo visitante no mesmo dia = mesmo hash. No dia seguinte o hash muda, então não dá pra seguir ninguém.
export function visitorHash(ip: string, userAgent: string | undefined, day: string, salt: string): string {
  return createHash("sha256").update(`${salt}|${day}|${ip}|${userAgent ?? ""}`).digest("hex").slice(0, 32)
}
