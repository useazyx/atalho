/**
 * CreateLinkService.ts - Cria um link curto
 * # Pra que serve?
 * - Conferir o destino, a validade e o apelido (se a pessoa escolheu um)
 * - Sem apelido, sortear um slug e tentar de novo se ele já existir (raríssimo, mas acontece)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { generateSlug, isReservedSlug } from "../../utils/slug.js"
import { LINK_SELECT, presentLink } from "./linkPresenter.js"
import {
  ALIAS_RESERVED,
  ALIAS_TAKEN,
  ensureValidTargetUrl,
  isUniqueViolation,
  parseExpiration,
} from "./linkRules.js"

export const SLUG_GENERATION_FAILED = "Não deu pra sortear um slug livre"

// Se 5 sorteios seguidos batem num slug existente, tem algo muito errado (não é azar)
const MAX_SLUG_ATTEMPTS = 5

// O que a gente precisa pra criar o link:
interface CreateLinkRequest {
  userId: string
  target_url: string
  alias?: string
  title?: string | null
  expires_at?: string | null
}

interface NewLinkData {
  user_id: string
  target_url: string
  title: string | null
  expires_at: Date | null
}

export class CreateLinkService {
  async execute({ userId, target_url, alias, title, expires_at }: CreateLinkRequest) {
    ensureValidTargetUrl(target_url)
    const expiresAt = parseExpiration(expires_at) ?? null

    if (alias && isReservedSlug(alias)) throw new Error(ALIAS_RESERVED)

    const data: NewLinkData = {
      user_id: userId,
      target_url,
      // Título vazio é o mesmo que sem título
      title: title?.trim() || null,
      expires_at: expiresAt,
    }

    const link = alias ? await this.createWithAlias(data, alias) : await this.createWithRandomSlug(data)

    return presentLink(link)
  }

  // Apelido é escolha da pessoa: se já existe, não dá pra trocar por outro sem avisar
  private async createWithAlias(data: NewLinkData, alias: string) {
    try {
      return await prisma.link.create({ data: { ...data, slug: alias }, select: LINK_SELECT })
    } catch (error) {
      if (isUniqueViolation(error)) throw new Error(ALIAS_TAKEN)
      throw error
    }
  }

  // Deixa o índice único do banco dizer se o slug já existe (checar antes não segura dois pedidos juntos)
  private async createWithRandomSlug(data: NewLinkData) {
    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
      try {
        return await prisma.link.create({ data: { ...data, slug: generateSlug() }, select: LINK_SELECT })
      } catch (error) {
        if (!isUniqueViolation(error)) throw error
      }
    }

    throw new Error(SLUG_GENERATION_FAILED)
  }
}
