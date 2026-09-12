import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36"

describe("redirect", () => {
  let app: TestApp
  let token: string

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDatabase()
    ;({ token } = await createUserAndLogin(app))
  })

  const createLink = async (payload: Record<string, unknown>) =>
    (await app.inject({ method: "POST", url: "/api/links", headers: authHeader(token), payload })).json()

  // O clique é gravado depois da resposta, então o teste espera ele aparecer
  const waitForClicks = (count: number) =>
    vi.waitFor(async () => expect(await prisma.click.count()).toBe(count), { timeout: 5_000, interval: 25 })

  it("redirects to the target and records the click without the IP", async () => {
    const link = await createLink({ target_url: "https://example.com/destino?x=1" })

    const response = await app.inject({
      method: "GET",
      url: `/${link.slug}`,
      remoteAddress: "200.10.20.30",
      headers: {
        "user-agent": CHROME_ANDROID,
        referer: "https://www.instagram.com/p/abc",
        "accept-language": "pt-BR,pt;q=0.9",
      },
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe("https://example.com/destino?x=1")
    expect(response.headers["cache-control"]).toBe("private, no-store")

    await waitForClicks(1)
    const click = await prisma.click.findFirstOrThrow()
    expect(click).toMatchObject({
      link_id: link.id,
      device: "MOBILE",
      browser: "Chrome",
      referrer_host: "instagram.com",
      language: "pt-BR",
    })
    expect(click.visitor_hash).toHaveLength(32)
    expect(JSON.stringify(click, (_key, value) => (typeof value === "bigint" ? value.toString() : value))).not.toContain(
      "200.10.20.30"
    )
  })

  it("gives the same visitor the same hash and a different visitor another", async () => {
    const link = await createLink({ target_url: "https://example.com" })
    const open = (ip: string) =>
      app.inject({ method: "GET", url: `/${link.slug}`, remoteAddress: ip, headers: { "user-agent": CHROME_ANDROID } })

    await open("200.1.1.1")
    await open("200.1.1.1")
    await open("200.2.2.2")

    await waitForClicks(3)
    const hashes = await prisma.click.findMany({ select: { visitor_hash: true } })
    expect(new Set(hashes.map((click) => click.visitor_hash)).size).toBe(2)
  })

  it("does not count HEAD requests", async () => {
    const link = await createLink({ target_url: "https://example.com" })

    const head = await app.inject({ method: "HEAD", url: `/${link.slug}` })
    await app.inject({ method: "GET", url: `/${link.slug}` })

    expect(head.statusCode).toBe(302)
    await waitForClicks(1)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(await prisma.click.count()).toBe(1)
  })

  it("answers 404 for unknown, malformed and reserved slugs", async () => {
    const unknown = await app.inject({ method: "GET", url: "/naoexiste" })
    const malformed = await app.inject({ method: "GET", url: "/favicon.ico" })
    const reserved = await app.inject({ method: "GET", url: "/api" })

    expect(unknown.statusCode).toBe(404)
    expect(unknown.json()).toEqual({ error: "LinkNotFound", message: "Esse link curto não existe" })
    expect(malformed.statusCode).toBe(404)
    expect(reserved.statusCode).toBe(404)
  })

  it("answers 410 for inactive and expired links, with a page for browsers", async () => {
    const inactive = await createLink({ target_url: "https://example.com", alias: "desligado" })
    const expired = await createLink({ target_url: "https://example.com", alias: "vencido" })

    await prisma.link.update({ where: { id: inactive.id }, data: { active: false } })
    await prisma.link.update({ where: { id: expired.id }, data: { expires_at: new Date(Date.now() - 60_000) } })

    const inactiveJson = await app.inject({ method: "GET", url: "/desligado" })
    const expiredPage = await app.inject({
      method: "GET",
      url: "/vencido",
      headers: { accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    })

    expect(inactiveJson.statusCode).toBe(410)
    expect(inactiveJson.json().error).toBe("LinkInactive")
    expect(expiredPage.statusCode).toBe(410)
    expect(expiredPage.headers["content-type"]).toContain("text/html")
    expect(expiredPage.body).toContain("Esse link expirou")
    expect(await prisma.click.count()).toBe(0)
  })
})
