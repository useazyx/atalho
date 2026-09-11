/**
 * slug.ts - Gera e confere o pedaço curto do link (o "abc1234" de /abc1234)
 * # Pra que serve?
 * - Gerar slug aleatório sem letras que se confundem (0 e O, 1, l e I), pra dá pra ditar e digitar
 * - Validar o apelido escolhido pela pessoa (minúsculo, número e hífen)
 * - Não deixar usar nome que a própria aplicação usa (api, docs...)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { randomInt } from "node:crypto"

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

// 7 caracteres num alfabeto de 56: mais de 1 trilhão de combinações, colisão é raridade
export const SLUG_LENGTH = 7

// 3 a 32 caracteres, começa e termina com letra ou número (hífen só no meio)
export const ALIAS_REGEX = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/

const RESERVED_SLUGS = new Set([
  "api",
  "docs",
  "health",
  "admin",
  "login",
  "entrar",
  "criar-conta",
  "links",
  "assets",
  "static",
  "favicon.ico",
  "robots.txt",
])

// randomInt usa gerador criptográfico: slug não dá pra adivinhar olhando os anteriores
export function generateSlug(length = SLUG_LENGTH): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")
}

export const isReservedSlug = (slug: string): boolean => RESERVED_SLUGS.has(slug.toLowerCase())
