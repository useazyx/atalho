import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("links", () => {
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

  const createLink = (payload: Record<string, unknown>, authToken = token) =>
    app.inject({ method: "POST", url: "/api/links", headers: authHeader(authToken), payload })

  it("requires a logged in user", async () => {
    const response = await app.inject({ method: "GET", url: "/api/links" })
    expect(response.statusCode).toBe(401)
  })

  it("creates a link with a random 7 character slug on the public address", async () => {
    const response = await createLink({ target_url: "https://example.com/pagina?utm=1", title: "  Exemplo " })

    expect(response.statusCode).toBe(201)
    const link = response.json()
    expect(link.slug).toMatch(/^[a-zA-Z2-9]{7}$/)
    expect(link).toMatchObject({
      short_url: `http://short.test/${link.slug}`,
      target_url: "https://example.com/pagina?utm=1",
      title: "Exemplo",
      status: "active",
      expires_at: null,
      total_clicks: 0,
    })
  })

  it("uses a custom alias in lowercase and refuses a taken or reserved one", async () => {
    const created = await createLink({ target_url: "https://example.com", alias: "Promo-Natal" })
    const taken = await createLink({ target_url: "https://example.org", alias: "promo-natal" })
    const reserved = await createLink({ target_url: "https://example.org", alias: "api" })
    const badFormat = await createLink({ target_url: "https://example.org", alias: "-oi" })

    expect(created.json().slug).toBe("promo-natal")
    expect(taken.statusCode).toBe(409)
    expect(taken.json().error).toBe("AliasTaken")
    expect(reserved.json().error).toBe("AliasReserved")
    expect(badFormat.statusCode).toBe(400)
    expect(badFormat.json().issues[0].field).toBe("body.alias")
  })

  it("refuses targets that are not http(s), not URLs or point back to the shortener", async () => {
    const script = await createLink({ target_url: "javascript:alert(1)" })
    const notUrl = await createLink({ target_url: "isso não é link" })
    const loop = await createLink({ target_url: "http://short.test/abc1234" })

    expect(script.json().error).toBe("TargetProtocolNotAllowed")
    expect(notUrl.json().error).toBe("InvalidTargetUrl")
    expect(loop.json().error).toBe("TargetIsShortLink")
  })

  it("refuses an expiration date in the past", async () => {
    const response = await createLink({ target_url: "https://example.com", expires_at: "2020-01-01T00:00:00.000Z" })

    expect(response.statusCode).toBe(400)
    expect(response.json().error).toBe("ExpirationInPast")
  })

  it("lists only my links, newest first, filtered by text and status", async () => {
    const other = await createUserAndLogin(app, "Outra Pessoa")
    await createLink({ target_url: "https://outra.com" }, other.token)

    const first = (await createLink({ target_url: "https://loja.com", title: "Loja" })).json()
    const second = (await createLink({ target_url: "https://blog.com/post", title: "Post do blog" })).json()
    const third = (await createLink({ target_url: "https://agenda.com", alias: "agenda" })).json()

    await app.inject({
      method: "PATCH",
      url: `/api/links/${second.id}`,
      headers: authHeader(token),
      payload: { active: false },
    })
    // Não dá pra criar vencido pela API, então vence direto no banco
    await prisma.link.update({ where: { id: third.id }, data: { expires_at: new Date(Date.now() - 60_000) } })

    const list = async (query: string) =>
      (await app.inject({ method: "GET", url: `/api/links${query}`, headers: authHeader(token) })).json()

    const all = await list("")
    expect(all.total).toBe(3)
    expect(all.links.map((link: { id: string }) => link.id)).toEqual([third.id, second.id, first.id])
    expect(all.links.map((link: { status: string }) => link.status)).toEqual(["expired", "inactive", "active"])

    expect((await list("?search=BLOG")).links[0].id).toBe(second.id)
    expect((await list("?status=active")).links.map((link: { id: string }) => link.id)).toEqual([first.id])
    expect((await list("?status=expired")).links.map((link: { id: string }) => link.id)).toEqual([third.id])

    const paged = await list("?page=2&page_size=2")
    expect(paged).toMatchObject({ total: 3, current_page: 2, total_pages: 2 })
    expect(paged.links).toHaveLength(1)
  })

  it("counts only human clicks", async () => {
    const link = (await createLink({ target_url: "https://example.com" })).json()
    await prisma.click.createMany({
      data: [
        { link_id: link.id, device: "DESKTOP", browser: "Chrome", visitor_hash: "a" },
        { link_id: link.id, device: "MOBILE", browser: "Safari", visitor_hash: "b" },
        { link_id: link.id, device: "BOT", browser: "Robô", visitor_hash: "c" },
      ],
    })

    const response = await app.inject({ method: "GET", url: `/api/links/${link.id}`, headers: authHeader(token) })

    expect(response.json().total_clicks).toBe(2)
  })

  it("updates only the fields sent and keeps the slug", async () => {
    const link = (
      await createLink({ target_url: "https://example.com", title: "Antes", expires_at: "2099-01-01T00:00:00.000Z" })
    ).json()

    const response = await app.inject({
      method: "PATCH",
      url: `/api/links/${link.id}`,
      headers: authHeader(token),
      payload: { target_url: "https://example.com/novo", title: null, expires_at: null },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      slug: link.slug,
      target_url: "https://example.com/novo",
      title: null,
      expires_at: null,
      active: true,
    })
  })

  it("rejects an empty update and hides links from other users", async () => {
    const link = (await createLink({ target_url: "https://example.com" })).json()
    const other = await createUserAndLogin(app, "Outra Pessoa")

    const empty = await app.inject({
      method: "PATCH",
      url: `/api/links/${link.id}`,
      headers: authHeader(token),
      payload: {},
    })
    const foreignGet = await app.inject({ method: "GET", url: `/api/links/${link.id}`, headers: authHeader(other.token) })
    const foreignPatch = await app.inject({
      method: "PATCH",
      url: `/api/links/${link.id}`,
      headers: authHeader(other.token),
      payload: { active: false },
    })
    const foreignDelete = await app.inject({
      method: "DELETE",
      url: `/api/links/${link.id}`,
      headers: authHeader(other.token),
    })

    expect(empty.statusCode).toBe(400)
    expect(foreignGet.statusCode).toBe(404)
    expect(foreignPatch.statusCode).toBe(404)
    expect(foreignDelete.statusCode).toBe(404)
    expect((await prisma.link.findUnique({ where: { id: link.id } }))?.active).toBe(true)
  })

  it("deletes a link together with its clicks", async () => {
    const link = (await createLink({ target_url: "https://example.com" })).json()
    await prisma.click.create({ data: { link_id: link.id, device: "DESKTOP", browser: "Chrome", visitor_hash: "a" } })

    const deleted = await app.inject({ method: "DELETE", url: `/api/links/${link.id}`, headers: authHeader(token) })
    const after = await app.inject({ method: "GET", url: `/api/links/${link.id}`, headers: authHeader(token) })

    expect(deleted.statusCode).toBe(204)
    expect(after.statusCode).toBe(404)
    expect(await prisma.click.count()).toBe(0)
  })
})
