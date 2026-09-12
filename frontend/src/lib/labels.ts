// Os valores crus das estatísticas viram texto pra gente ler

const DEVICE_LABELS: Record<string, string> = {
  DESKTOP: "Computador",
  MOBILE: "Celular",
  TABLET: "Tablet",
  UNKNOWN: "Não identificado",
  BOT: "Robô",
}

export const deviceLabel = (label: string | null) => (label ? (DEVICE_LABELS[label] ?? label) : "Não identificado")

// Sem referrer: veio digitado, de app (WhatsApp, e-mail) ou de site que não manda de onde veio
export const referrerLabel = (label: string | null) => label ?? "Direto ou app"

export const browserLabel = (label: string | null) => label ?? "Não identificado"

const languageNames = new Intl.DisplayNames(["pt-BR"], { type: "language" })

// "pt-BR" -> "Português (Brasil)"
export function languageLabel(label: string | null) {
  if (!label) return "Não informado"
  try {
    const name = languageNames.of(label)
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : label
  } catch {
    return label
  }
}
