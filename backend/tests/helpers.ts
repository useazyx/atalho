/**
 * helpers.ts - Atalhos que todo teste usa
 * # Pra que serve?
 * - Subir a API sem abrir porta (buildApp + inject)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { buildApp } from "../src/app.js"

export type TestApp = Awaited<ReturnType<typeof buildApp>>

export async function createTestApp(options: Parameters<typeof buildApp>[0] = {}) {
  const app = await buildApp(options)
  await app.ready()
  return app
}
