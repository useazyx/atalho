import QRCode from "qrcode"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("link QR code", () => {
  let app: TestApp
  let token: string
  let link: { id: string; slug: string; short_url: string }

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDatabase()
    ;({ token } = await createUserAndLogin(app))

    const created = await app.inject({
      method: "POST",
      url: "/api/links",
      headers: authHeader(token),
      payload: { target_url: "https://example.com/um/destino/bem/comprido", alias: "cardapio" },
    })
    link = created.json()
  })

  const getQr = (query = "", authToken = token) =>
    app.inject({ method: "GET", url: `/api/links/${link.id}/qr${query}`, headers: authHeader(authToken) })

  it("encodes the short address, not the target, as SVG by default", async () => {
    const response = await getQr()
    const expected = await QRCode.toString(link.short_url, { errorCorrectionLevel: "M", margin: 2, type: "svg" })

    expect(response.statusCode).toBe(200)
    expect(response.headers["content-type"]).toContain("image/svg+xml")
    expect(response.headers["content-disposition"]).toBe('inline; filename="atalho-cardapio.svg"')
    expect(response.body).toBe(expected)
  })

  it("renders a PNG with the requested width", async () => {
    const response = await getQr("?format=png&size=256")
    const png = response.rawPayload

    expect(response.statusCode).toBe(200)
    expect(response.headers["content-type"]).toBe("image/png")
    // Assinatura do PNG e a largura que fica no cabeçalho IHDR
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a")
    expect(png.readUInt32BE(16)).toBe(256)
  })

  it("rejects unknown formats and sizes, and hides other people's links", async () => {
    const other = await createUserAndLogin(app, "Outra Pessoa")

    expect((await getQr("?format=gif")).statusCode).toBe(400)
    expect((await getQr("?format=png&size=5000")).statusCode).toBe(400)
    expect((await getQr("", other.token)).statusCode).toBe(404)
  })
})
