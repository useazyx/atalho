/**
 * RegisterUserService.ts - Cria a conta de uma pessoa
 * # Pra que serve?
 * - Garantir que o e-mail ainda não tem conta
 * - Salvar o usuário com a senha em hash (nunca a senha pura)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../../config/prisma.js"
import { hashPassword } from "../../utils/password.js"
import { presentUser, PUBLIC_USER_SELECT } from "./userPresenter.js"

export const EMAIL_ALREADY_USED = "E-mail já cadastrado"

// O que a gente precisa pra criar a conta:
interface RegisterUserRequest {
  name: string
  email: string
  password: string
}

export class RegisterUserService {
  async execute({ name, email, password }: RegisterUserRequest) {
    // Checa antes pra dar erro amigável no caso comum
    await this.ensureEmailIsFree(email)

    const password_hash = await hashPassword(password)
    const user = await this.createUser({ name, email, password_hash })

    return presentUser(user)
  }

  private async ensureEmailIsFree(email: string) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) throw new Error(EMAIL_ALREADY_USED)
  }

  // Se dois cadastros com o mesmo e-mail chegarem juntos, o índice único segura o segundo
  private async createUser(data: { name: string; email: string; password_hash: string }) {
    try {
      return await prisma.user.create({ data, select: PUBLIC_USER_SELECT })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(EMAIL_ALREADY_USED)
      }
      throw error
    }
  }
}
