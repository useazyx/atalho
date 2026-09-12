import { describe, expect, it } from "vitest"
import { describeChange, formatDay, fromDateTimeLocal, hostOf, toDateTimeLocal, withoutProtocol } from "./format"

describe("format", () => {
  it("describes the change from the previous period in words", () => {
    expect(describeChange(120, 100, 7)).toEqual({ direction: "up", text: "+20% vs. 7 dias anteriores" })
    expect(describeChange(80, 100, 30)).toEqual({ direction: "down", text: "−20% vs. 30 dias anteriores" })
    expect(describeChange(100, 100, 7)).toEqual({ direction: "flat", text: "Igual aos 7 dias anteriores" })
    expect(describeChange(5, 0, 7).direction).toBe("new")
    expect(describeChange(0, 0, 7).direction).toBe("flat")
  })

  it("formats stats days without shifting them by the browser time zone", () => {
    expect(formatDay("2026-09-11")).toBe("11 de set")
    expect(formatDay("2026-01-01")).toBe("1 de jan")
  })

  it("keeps the datetime-local round trip exact", () => {
    const iso = "2026-12-31T23:30:00.000Z"
    expect(fromDateTimeLocal(toDateTimeLocal(iso))).toBe(iso)
  })

  it("shortens addresses for display", () => {
    expect(withoutProtocol("http://localhost:3337/github")).toBe("localhost:3337/github")
    expect(hostOf("https://www.github.com/useazyx")).toBe("github.com")
    expect(hostOf("não é url")).toBe("não é url")
  })
})
