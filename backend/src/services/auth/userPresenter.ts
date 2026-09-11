/**
 * userPresenter.ts - Como um usuário sai da API
 * # Pra que serve?
 * - Definir os campos públicos (password_hash nunca entra aqui)
 * - Converter a data pra texto ISO, que é o que o schema de resposta espera
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { Prisma } from "@prisma/client"

export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  created_at: true,
} satisfies Prisma.UserSelect

export function presentUser(user: Prisma.UserGetPayload<{ select: typeof PUBLIC_USER_SELECT }>) {
  return { ...user, created_at: user.created_at.toISOString() }
}
