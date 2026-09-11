/**
 * env.ts - Lê e valida as variáveis de ambiente antes de qualquer coisa subir
 * # Pra que serve?
 * - Garantir que o .env tem tudo que a API precisa (se faltar algo, nem sobe)
 * - Entregar as variáveis já convertidas (porta como número, endereço público sem barra no fim etc.)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { config } from "dotenv"
import { z } from "zod"

// Carrega o .env (nos testes o vitest já manda as variáveis, e o dotenv não sobrescreve)
config({ quiet: true })

// O formato que a gente espera de cada variável
const ENV_SCHEMA = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3337),
  HOST: z.string().default("0.0.0.0"),
  // Sem barra no fim: é concatenado com o slug ("http://localhost:3337" + "/" + "abc1234")
  PUBLIC_BASE_URL: z
    .url("PUBLIC_BASE_URL precisa ser uma URL (tipo http://localhost:3337)")
    .default("http://localhost:3337")
    .transform((value) => value.replace(/\/+$/, "")),
  DATABASE_URL: z.string().min(1, "Falta o DATABASE_URL"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET muito curto, usa pelo menos 16 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  VISITOR_SALT: z.string().min(8, "VISITOR_SALT muito curto"),
  // "*" libera qualquer site; em produção, lista separada por vírgula
  CORS_ORIGINS: z
    .string()
    .default("*")
    .transform((value) => (value === "*" ? true : value.split(",").map((origin) => origin.trim()))),
})

const parsed = ENV_SCHEMA.safeParse(process.env)

// Se tiver algo errado, mostra exatamente o quê e para tudo (melhor que quebrar lá na frente)
if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:")
  console.error(z.prettifyError(parsed.error))
  console.error("👉 Confere o .env (o modelo tá no .env.example)")
  process.exit(1)
}

export const env = parsed.data
