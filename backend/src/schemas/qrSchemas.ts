/**
 * qrSchemas.ts - O formato do pedido de QR code
 * # Pra que serve?
 * - SVG pra tela (fica nítido em qualquer tamanho) e PNG pra baixar e mandar pra gráfica ou WhatsApp
 * - Limitar o tamanho do PNG (ninguém precisa de QR code de 10 mil pixels, e o servidor agradece)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"

export const QR_FORMATS = ["svg", "png"] as const

export const LINK_QR_QUERY_SCHEMA = z.object({
  format: z.enum(QR_FORMATS).default("svg"),
  // Largura do PNG em pixels (no SVG não faz diferença)
  size: z.coerce.number().int().min(128, "Tamanho mínimo é 128 pixels").max(1024, "Tamanho máximo é 1024 pixels").default(512),
})

export type LinkQrQuery = z.infer<typeof LINK_QR_QUERY_SCHEMA>
