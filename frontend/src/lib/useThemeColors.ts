import { useEffect, useState } from "react"

// SVG não entende var() no atributo fill/stroke, então o gráfico precisa das cores já resolvidas.
// Os valores de fallback são os do tema claro (usados também nos testes, onde não tem CSS).
const FALLBACK = {
  ink: "#0b0b0b",
  inkSecondary: "#52514e",
  inkMuted: "#6f6d68",
  grid: "#e1e0d9",
  surface: "#fcfcfb",
  series1: "#2a78d6",
  series2: "#eb6834",
}

export type ThemeColors = typeof FALLBACK

const VARIABLES: Record<keyof ThemeColors, string> = {
  ink: "--color-ink",
  inkSecondary: "--color-ink-secondary",
  inkMuted: "--color-ink-muted",
  grid: "--color-grid",
  surface: "--color-surface",
  series1: "--color-series-1",
  series2: "--color-series-2",
}

function readColors(): ThemeColors {
  if (typeof window === "undefined") return FALLBACK
  const style = getComputedStyle(document.documentElement)
  const entries = Object.entries(VARIABLES).map(([key, variable]) => {
    const value = style.getPropertyValue(variable).trim()
    return [key, value || FALLBACK[key as keyof ThemeColors]]
  })
  return Object.fromEntries(entries) as ThemeColors
}

export function useThemeColors() {
  const [colors, setColors] = useState(readColors)

  // Trocou o tema do sistema (claro/escuro): lê as cores de novo
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)")
    if (!media) return
    const update = () => setColors(readColors())
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return colors
}
