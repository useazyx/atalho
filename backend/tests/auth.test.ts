import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("auth", () => {
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

  it("creates an account with a normalized email and never returns the password", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { name: "Ana Souza", email: "  Ana@Email.com ", password: "senha-forte-123" },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ name: "Ana Souza", email: "ana@email.com" })
    expect(response.body).not.toContain("password")
  })

  it("refuses a second account with the same email", async () => {
    const payload = { name: "Ana", email: "ana@email.com", password: "senha-forte-123" }
    await app.inject({ method: "POST", url: "/api/auth/register", payload })

    const duplicate = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { ...payload, email: "ANA@email.com" },
    })

    expect(duplicate.statusCode).toBe(409)
    expect(duplicate.json().error).toBe("EmailAlreadyUsed")
  })

  it("rejects invalid fields and says which ones", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { name: "A", email: "not-an-email", password: "123" },
    })

    expect(response.statusCode).toBe(400)
    const fields = response.json().issues.map((issue: { field: string }) => issue.field)
    expect(fields).toEqual(expect.arrayContaining(["body.name", "body.email", "body.password"]))
  })

  it("answers the same way for a wrong password and an unknown email", async () => {
    const { email } = await createUserAndLogin(app)

    const wrongPassword = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password: "senha-errada" },
    })
    const unknownEmail = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "ninguem@teste.com", password: "senha-errada" },
    })

    expect(wrongPassword.statusCode).toBe(401)
    expect(wrongPassword.json()).toEqual(unknownEmail.json())
  })

  it("protects /api/auth/me and returns the logged in user", async () => {
    const { token, email } = await createUserAndLogin(app)

    const withoutToken = await app.inject({ method: "GET", url: "/api/auth/me" })
    const withToken = await app.inject({ method: "GET", url: "/api/auth/me", headers: authHeader(token) })

    expect(withoutToken.statusCode).toBe(401)
    expect(withToken.json().email).toBe(email)
  })
})
