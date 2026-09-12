import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { DEMO_EMAIL, DEMO_PASSWORD, seed } from "../prisma/seed.js"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, resetDatabase, type TestApp } from "./helpers.js"

describe("seed", () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  const countRows = async () => ({
    users: await prisma.user.count(),
    links: await prisma.link.count(),
    clicks: await prisma.click.count(),
  })

  it("creates the demo account once, with clicks only in the past", async () => {
    const now = new Date()

    await seed(now)
    const firstRun = await countRows()
    await seed(now)

    expect(await countRows()).toEqual(firstRun)
    expect(firstRun).toMatchObject({ users: 1, links: 6 })
    expect(firstRun.clicks).toBeGreaterThan(500)
    expect(await prisma.click.count({ where: { clicked_at: { gt: now } } })).toBe(0)
  })

  it("lets the demo user log in and see links in every status with stats", async () => {
    await seed()

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    })
    const token = login.json().token

    const list = (await app.inject({ method: "GET", url: "/api/links", headers: authHeader(token) })).json()
    const statuses = new Set(list.links.map((link: { status: string }) => link.status))

    const github = list.links.find((link: { slug: string }) => link.slug === "github")
    const stats = (
      await app.inject({ method: "GET", url: `/api/links/${github.id}/stats?days=30`, headers: authHeader(token) })
    ).json()

    expect(login.statusCode).toBe(200)
    expect(statuses).toEqual(new Set(["active", "inactive", "expired"]))
    expect(stats.totals.clicks).toBeGreaterThan(100)
    expect(stats.totals.bot_clicks).toBeGreaterThan(0)
    expect(stats.referrers.length).toBeGreaterThan(1)
  })
})
