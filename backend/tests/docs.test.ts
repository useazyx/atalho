import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createTestApp, type TestApp } from "./helpers.js"

describe("API docs", () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it("publishes the OpenAPI document generated from the route schemas", async () => {
    const response = await app.inject({ method: "GET", url: "/docs/json" })

    expect(response.statusCode).toBe(200)
    const document = response.json()

    expect(document.openapi).toMatch(/^3\./)
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        "/api/auth/login",
        "/api/links/",
        "/api/links/{id}",
        "/api/links/{id}/stats",
        "/api/links/{id}/qr",
        "/{slug}",
      ])
    )
    expect(document.components.securitySchemes.bearerAuth).toMatchObject({ type: "http", scheme: "bearer" })
  })

  it("serves the docs page instead of treating /docs as a short link", async () => {
    const response = await app.inject({ method: "GET", url: "/docs" })

    expect(response.statusCode).toBe(200)
    expect(response.headers["content-type"]).toContain("text/html")
  })
})
