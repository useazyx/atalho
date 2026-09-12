import { describe, expect, it } from "vitest"
import { ApiError } from "./api"
import { normalizeTargetUrl, readLinkError } from "./linkForm"

describe("link form helpers", () => {
  it("adds https to addresses pasted without protocol and leaves the rest for the API to judge", () => {
    expect(normalizeTargetUrl(" github.com/useazyx ")).toBe("https://github.com/useazyx")
    expect(normalizeTargetUrl("http://example.com")).toBe("http://example.com")
    expect(normalizeTargetUrl("javascript:alert(1)")).toBe("javascript:alert(1)")
    expect(normalizeTargetUrl("   ")).toBe("")
  })

  it("routes API errors to the field they belong to", () => {
    expect(readLinkError(new ApiError(409, "AliasTaken", "Apelido em uso"))).toEqual({
      fields: { alias: "Apelido em uso" },
      message: null,
    })
    expect(
      readLinkError(
        new ApiError(400, "ValidationError", "Tem campo inválido", [{ field: "body.target_url", message: "Muito longo" }])
      )
    ).toEqual({ fields: { target_url: "Muito longo" }, message: null })
    expect(readLinkError(new ApiError(500, "InternalServerError", "Deu ruim"))).toEqual({ fields: {}, message: "Deu ruim" })
  })
})
