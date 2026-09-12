import { describe, expect, it } from "vitest"
import { parseUserAgent, primaryLanguage, referrerHost, visitorHash } from "../src/utils/clickContext.js"
import { ALIAS_REGEX, generateSlug, isReservedSlug, SLUG_LENGTH } from "../src/utils/slug.js"
import { checkTargetUrl } from "../src/utils/targetUrl.js"
import { addDays, listDays, localDay } from "../src/utils/timeZone.js"

const UA = {
  chromeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0",
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  firefoxMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:130.0) Gecko/20100101 Firefox/130.0",
  whatsapp: "WhatsApp/2.24.10.85 A",
  googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
}

describe("slugs", () => {
  it("generates slugs without look-alike characters", () => {
    const slugs = Array.from({ length: 500 }, () => generateSlug())

    expect(slugs.every((slug) => slug.length === SLUG_LENGTH)).toBe(true)
    expect(slugs.some((slug) => /[0O1lI]/.test(slug))).toBe(false)
    expect(new Set(slugs).size).toBe(500)
  })

  it("validates custom aliases and reserved names", () => {
    expect(ALIAS_REGEX.test("black-friday")).toBe(true)
    expect(ALIAS_REGEX.test("ab")).toBe(false)
    expect(ALIAS_REGEX.test("-promo")).toBe(false)
    expect(ALIAS_REGEX.test("Promo")).toBe(false)
    expect(isReservedSlug("API")).toBe(true)
    expect(isReservedSlug("black-friday")).toBe(false)
  })
})

describe("click context", () => {
  it("tells devices and browser families apart", () => {
    expect(parseUserAgent(UA.chromeWindows)).toEqual({ device: "DESKTOP", browser: "Chrome" })
    expect(parseUserAgent(UA.edge)).toEqual({ device: "DESKTOP", browser: "Edge" })
    expect(parseUserAgent(UA.iphoneSafari)).toEqual({ device: "MOBILE", browser: "Safari" })
    expect(parseUserAgent(UA.androidChrome)).toEqual({ device: "MOBILE", browser: "Chrome" })
    expect(parseUserAgent(UA.ipad)).toEqual({ device: "TABLET", browser: "Safari" })
    expect(parseUserAgent(UA.firefoxMac)).toEqual({ device: "DESKTOP", browser: "Firefox" })
    expect(parseUserAgent(undefined)).toEqual({ device: "UNKNOWN", browser: "Desconhecido" })
  })

  it("flags link previews and crawlers as bots", () => {
    expect(parseUserAgent(UA.whatsapp).device).toBe("BOT")
    expect(parseUserAgent(UA.googlebot).device).toBe("BOT")
  })

  it("keeps only the referrer domain and the main language", () => {
    expect(referrerHost("https://www.instagram.com/p/abc?x=1")).toBe("instagram.com")
    expect(referrerHost("not a url")).toBeNull()
    expect(referrerHost(undefined)).toBeNull()
    expect(primaryLanguage("pt-br,pt;q=0.9,en;q=0.8")).toBe("pt-BR")
    expect(primaryLanguage("en")).toBe("en")
    expect(primaryLanguage("*")).toBeNull()
  })

  it("hashes visitors per day without exposing the IP", () => {
    const monday = visitorHash("200.1.2.3", UA.chromeWindows, "2026-09-07", "salt")
    const sameVisitor = visitorHash("200.1.2.3", UA.chromeWindows, "2026-09-07", "salt")
    const nextDay = visitorHash("200.1.2.3", UA.chromeWindows, "2026-09-08", "salt")

    expect(monday).toBe(sameVisitor)
    expect(monday).not.toBe(nextDay)
    expect(monday).not.toContain("200.1.2.3")
    expect(monday).toHaveLength(32)
  })
})

describe("time zone", () => {
  it("puts a late night click in the local day, not the UTC one", () => {
    const lateNightInSaoPaulo = new Date("2026-09-12T01:30:00.000Z")

    expect(localDay(lateNightInSaoPaulo)).toBe("2026-09-11")
    expect(localDay(lateNightInSaoPaulo, "UTC")).toBe("2026-09-12")
  })

  it("adds days across month and year boundaries and lists a period", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
    expect(listDays("2026-09-29", "2026-10-02")).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"])
    expect(listDays("2026-09-02", "2026-09-01")).toEqual([])
  })
})

describe("target urls", () => {
  it("accepts only http(s) links that do not point back to the shortener", () => {
    const base = "http://short.test"

    expect(checkTargetUrl("https://github.com/useazyx", base)).toBeNull()
    expect(checkTargetUrl("javascript:alert(1)", base)).toBe("protocol")
    expect(checkTargetUrl("ftp://files.example.com", base)).toBe("protocol")
    expect(checkTargetUrl("http://short.test/abc1234", base)).toBe("self")
    expect(checkTargetUrl("github.com", base)).toBe("invalid")
  })
})
