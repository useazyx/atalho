import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { addDays, localDay } from "../src/utils/timeZone.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

// São Paulo não tem horário de verão desde 2019, então o fuso é sempre -03:00
const atSaoPaulo = (day: string, time: string) => new Date(`${day}T${time}-03:00`)

type ClickSeed = {
  at: Date
  device?: "DESKTOP" | "MOBILE" | "BOT"
  browser?: string
  referrer_host?: string | null
  language?: string | null
  visitor_hash: string
}

describe("link stats", () => {
  let app: TestApp
  let token: string
  let linkId: string

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDatabase()
    ;({ token } = await createUserAndLogin(app))

    const link = await app.inject({
      method: "POST",
      url: "/api/links",
      headers: authHeader(token),
      payload: { target_url: "https://example.com" },
    })
    linkId = link.json().id
  })

  const seedClicks = (clicks: ClickSeed[]) =>
    prisma.click.createMany({
      data: clicks.map(({ at, device = "DESKTOP", browser = "Chrome", referrer_host = null, language = null, visitor_hash }) => ({
        link_id: linkId,
        clicked_at: at,
        device,
        browser,
        referrer_host,
        language,
        visitor_hash,
      })),
    })

  const getStats = (query = "", authToken = token) =>
    app.inject({ method: "GET", url: `/api/links/${linkId}/stats${query}`, headers: authHeader(authToken) })

  it("counts clicks and unique visitors per local day, without bots, and compares with the previous period", async () => {
    const today = localDay(new Date())
    const yesterday = addDays(today, -1)

    await seedClicks([
      { at: atSaoPaulo(today, "00:05:00"), visitor_hash: "hoje-a", referrer_host: "instagram.com", language: "pt-BR" },
      { at: atSaoPaulo(today, "00:10:00"), visitor_hash: "hoje-a", referrer_host: "instagram.com", language: "pt-BR" },
      { at: atSaoPaulo(today, "00:15:00"), visitor_hash: "hoje-b", device: "MOBILE", browser: "Safari" },
      { at: atSaoPaulo(today, "00:20:00"), visitor_hash: "robo", device: "BOT", browser: "Robô" },
      // 23h30 em São Paulo já é dia seguinte em UTC, mas tem que cair em "ontem"
      { at: atSaoPaulo(yesterday, "23:30:00"), visitor_hash: "ontem-a", referrer_host: "instagram.com", language: "en" },
      // Período anterior (dias 7 a 13 pra trás) e fora de tudo
      { at: atSaoPaulo(addDays(today, -10), "12:00:00"), visitor_hash: "antes-a" },
      { at: atSaoPaulo(addDays(today, -20), "12:00:00"), visitor_hash: "muito-antes" },
    ])

    const response = await getStats("?days=7")

    expect(response.statusCode).toBe(200)
    const stats = response.json()

    expect(stats).toMatchObject({
      link_id: linkId,
      days: 7,
      time_zone: "America/Sao_Paulo",
      from: addDays(today, -6),
      to: today,
      totals: { clicks: 4, unique_visitors: 3, previous_clicks: 1, previous_unique_visitors: 1, bot_clicks: 1 },
    })

    expect(stats.daily).toHaveLength(7)
    expect(stats.daily.at(-1)).toEqual({ date: today, clicks: 3, unique_visitors: 2 })
    expect(stats.daily.at(-2)).toEqual({ date: yesterday, clicks: 1, unique_visitors: 1 })
    expect(stats.daily.slice(0, 5).every((day: { clicks: number }) => day.clicks === 0)).toBe(true)

    expect(stats.referrers).toEqual([
      { label: "instagram.com", clicks: 3 },
      { label: null, clicks: 1 },
    ])
    expect(stats.devices).toEqual([
      { label: "DESKTOP", clicks: 3 },
      { label: "MOBILE", clicks: 1 },
    ])
    expect(stats.browsers).toEqual([
      { label: "Chrome", clicks: 3 },
      { label: "Safari", clicks: 1 },
    ])
    expect(stats.languages).toEqual([
      { label: "pt-BR", clicks: 2 },
      { label: null, clicks: 1 },
      { label: "en", clicks: 1 },
    ])
  })

  it("defaults to 30 days and fills days without clicks with zero", async () => {
    const stats = (await getStats()).json()

    expect(stats.days).toBe(30)
    expect(stats.daily).toHaveLength(30)
    expect(stats.totals).toEqual({
      clicks: 0,
      unique_visitors: 0,
      previous_clicks: 0,
      previous_unique_visitors: 0,
      bot_clicks: 0,
    })
    expect(stats.referrers).toEqual([])
  })

  it("rejects an invalid period and hides other people's links", async () => {
    const other = await createUserAndLogin(app, "Outra Pessoa")

    const invalid = await getStats("?days=0")
    const tooLong = await getStats("?days=400")
    const foreign = await getStats("", other.token)

    expect(invalid.statusCode).toBe(400)
    expect(tooLong.statusCode).toBe(400)
    expect(foreign.statusCode).toBe(404)
    expect(foreign.json().error).toBe("LinkNotFound")
  })
})
