/**
 * seed.ts - Dados de demonstração pra o painel abrir com vida
 * # Pra que serve?
 * - Criar a conta demo com 6 links, um desativado e um vencido (pra tela mostrar os três status)
 * - Gerar 60 dias de cliques com cara de tráfego de verdade: mais celular, mais de dia, menos no fim de semana, alguns robôs
 * - Sempre os mesmos números (sorteio com semente fixa), então print e teste não mudam de uma rodada pra outra
 * - Rodar em todo `npm run dev` sem duplicar nada e sem apagar clique que alguém fez testando
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-12
 * Alterações:
 * - v1.0.0 (2026-09-12): Implementação inicial
 *
 * Como rodar:
 *   npx prisma db seed
 * O `npm run dev` já chama ele automaticamente.
 */

import { createHash } from "node:crypto"
import { pathToFileURL } from "node:url"
import type { Prisma } from "@prisma/client"
import { prisma } from "../src/config/prisma.js"
import { hashPassword } from "../src/utils/password.js"
import { addDays, localDay } from "../src/utils/timeZone.js"

export const DEMO_EMAIL = "demo@atalho.dev"
export const DEMO_PASSWORD = "atalho123"

const DAYS_OF_HISTORY = 60

type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "BOT"
type WeightedOptions<T> = [T, number][]

interface DemoLink {
  slug: string
  target_url: string
  title: string
  // Média de cliques num dia útil (fim de semana tem menos)
  clicksPerDay: number
  // Link desativado ou vencido para de receber clique nesse dia (contado pra trás a partir de hoje)
  stopsDaysAgo?: number
  status: "active" | "inactive" | "expired"
}

const DEMO_LINKS: DemoLink[] = [
  { slug: "github", target_url: "https://github.com/useazyx", title: "Meu GitHub", clicksPerDay: 9, status: "active" },
  {
    slug: "atalho-codigo",
    target_url: "https://github.com/useazyx/atalho",
    title: "Código do Atalho",
    clicksPerDay: 5,
    status: "active",
  },
  {
    slug: "estudar-node",
    target_url: "https://nodejs.org/en/learn",
    title: "Material de estudo: Node.js",
    clicksPerDay: 3,
    status: "active",
  },
  {
    slug: "docs-postgres",
    target_url: "https://www.postgresql.org/docs/current/",
    title: "Documentação do PostgreSQL",
    clicksPerDay: 2,
    status: "active",
  },
  {
    slug: "slides-http",
    target_url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status",
    title: "Slides da palestra sobre HTTP",
    clicksPerDay: 4,
    stopsDaysAgo: 20,
    status: "inactive",
  },
  {
    slug: "workshop-react",
    target_url: "https://react.dev/learn",
    title: "Inscrição do workshop de React",
    clicksPerDay: 6,
    stopsDaysAgo: 5,
    status: "expired",
  },
]

// Hora do dia em São Paulo: quase nada de madrugada, pico no almoço e à noite
const HOUR_WEIGHTS: WeightedOptions<number> = [
  [0, 2], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 2], [7, 4], [8, 6], [9, 7], [10, 7], [11, 8],
  [12, 9], [13, 8], [14, 7], [15, 7], [16, 7], [17, 7], [18, 8], [19, 9], [20, 10], [21, 9], [22, 6], [23, 4],
]

const DEVICE_WEIGHTS: WeightedOptions<DeviceType> = [
  ["MOBILE", 58],
  ["DESKTOP", 34],
  ["TABLET", 3],
  ["BOT", 5],
]

const BROWSER_WEIGHTS: Record<DeviceType, WeightedOptions<string>> = {
  MOBILE: [["Chrome", 60], ["Safari", 32], ["Samsung Internet", 8]],
  DESKTOP: [["Chrome", 62], ["Edge", 16], ["Firefox", 12], ["Safari", 10]],
  TABLET: [["Safari", 70], ["Chrome", 30]],
  BOT: [["Robô", 1]],
}

// null = acesso direto (WhatsApp, e-mail e app de celular normalmente não mandam de onde veio)
const REFERRER_WEIGHTS: WeightedOptions<string | null> = [
  [null, 38],
  ["linkedin.com", 20],
  ["instagram.com", 16],
  ["github.com", 12],
  ["google.com", 8],
  ["t.co", 6],
]

const LANGUAGE_WEIGHTS: WeightedOptions<string | null> = [
  ["pt-BR", 78],
  ["en-US", 10],
  ["pt-PT", 4],
  ["es-ES", 3],
  [null, 5],
]

export async function seed(now = new Date()) {
  const userId = await upsertDemoUser()
  const today = localDay(now)

  for (const demoLink of DEMO_LINKS) {
    const linkId = await upsertLink(userId, demoLink, today)

    // Já tem clique (do seed anterior ou de alguém testando): deixa quieto
    const existingClicks = await prisma.click.count({ where: { link_id: linkId } })
    if (existingClicks > 0) continue

    await prisma.click.createMany({ data: generateClicks(linkId, demoLink, today, now) })
  }
}

async function upsertDemoUser() {
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Conta Demo", password_hash: passwordHash },
    create: { name: "Conta Demo", email: DEMO_EMAIL, password_hash: passwordHash },
    select: { id: true },
  })

  return user.id
}

// Upsert pelo slug com update vazio: se a pessoa mexeu no link demo, o seed não desfaz
async function upsertLink(userId: string, demoLink: DemoLink, today: string) {
  const createdAt = midnightInSaoPaulo(addDays(today, -DAYS_OF_HISTORY))
  const stopDay = demoLink.stopsDaysAgo ? midnightInSaoPaulo(addDays(today, -demoLink.stopsDaysAgo)) : null

  const link = await prisma.link.upsert({
    where: { slug: demoLink.slug },
    update: {},
    create: {
      user_id: userId,
      slug: demoLink.slug,
      target_url: demoLink.target_url,
      title: demoLink.title,
      active: demoLink.status !== "inactive",
      expires_at: demoLink.status === "expired" ? stopDay : null,
      created_at: createdAt,
    },
    select: { id: true },
  })

  return link.id
}

function generateClicks(linkId: string, demoLink: DemoLink, today: string, now: Date) {
  const random = createRandom(demoLink.slug)
  const clicks: Prisma.ClickCreateManyInput[] = []
  const lastDay = demoLink.stopsDaysAgo ? addDays(today, -demoLink.stopsDaysAgo - 1) : today

  for (let daysAgo = DAYS_OF_HISTORY - 1; daysAgo >= 0; daysAgo--) {
    const day = addDays(today, -daysAgo)
    if (day > lastDay) break

    const count = dailyClickCount(demoLink, day, lastDay, random)
    // Menos visitantes que cliques: tem gente que abre o mesmo link duas vezes no dia
    const visitorPool = Math.max(1, Math.ceil(count * 0.8))

    for (let position = 0; position < count; position++) {
      const clickedAt = randomMomentOfDay(day, random)
      if (clickedAt > now) continue

      const device = pickWeighted(random, DEVICE_WEIGHTS)
      const isBot = device === "BOT"
      const visitor = isBot ? `bot-${position}` : String(Math.floor(random() * visitorPool))

      clicks.push({
        link_id: linkId,
        clicked_at: clickedAt,
        device,
        browser: pickWeighted(random, BROWSER_WEIGHTS[device]),
        referrer_host: isBot ? null : pickWeighted(random, REFERRER_WEIGHTS),
        language: isBot ? null : pickWeighted(random, LANGUAGE_WEIGHTS),
        visitor_hash: createHash("sha256").update(`seed|${demoLink.slug}|${day}|${visitor}`).digest("hex").slice(0, 32),
      })
    }
  }

  return clicks
}

// Dia útil cheio, fim de semana com 60%, e o workshop bombando nos últimos dias antes de vencer
function dailyClickCount(demoLink: DemoLink, day: string, lastDay: string, random: () => number) {
  const weekDay = new Date(`${day}T12:00:00.000Z`).getUTCDay()
  const weekendFactor = weekDay === 0 || weekDay === 6 ? 0.6 : 1
  const rushFactor = demoLink.status === "expired" && day > addDays(lastDay, -7) ? 2.5 : 1
  const noise = 0.6 + random() * 0.8

  return Math.round(demoLink.clicksPerDay * weekendFactor * rushFactor * noise)
}

function randomMomentOfDay(day: string, random: () => number) {
  const hour = String(pickWeighted(random, HOUR_WEIGHTS)).padStart(2, "0")
  const minute = String(Math.floor(random() * 60)).padStart(2, "0")
  const second = String(Math.floor(random() * 60)).padStart(2, "0")

  return new Date(`${day}T${hour}:${minute}:${second}-03:00`)
}

// São Paulo está sem horário de verão desde 2019, então é sempre -03:00
const midnightInSaoPaulo = (day: string) => new Date(`${day}T00:00:00-03:00`)

function pickWeighted<T>(random: () => number, options: WeightedOptions<T>): T {
  const total = options.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total

  for (const [value, weight] of options) {
    roll -= weight
    if (roll < 0) return value
  }

  return options[options.length - 1][0]
}

// mulberry32: gerador pequeno com semente. Mesma semente = mesma sequência, toda vez
function createRandom(seedText: string) {
  let state = createHash("sha256").update(seedText).digest().readUInt32LE(0)

  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

// Só roda sozinho quando chamado direto (o teste importa a função sem disparar o seed)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then(() => console.log(`🌱 Seed pronto. Login de demonstração: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`))
    .catch((error) => {
      console.error("❌ Deu ruim no seed:", error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
