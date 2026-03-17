import {
  formatDurationInputValue,
  formatDurationMaskValue,
  formatMinutesSeconds,
  normalizeDurationMaskValue,
  parseMinutesSeconds,
} from "@/lib/workouts/duration"

describe("duration helpers", () => {
  it("formats duration values as mm:ss when requested", () => {
    expect(formatMinutesSeconds(900)).toBe("15:00")
    expect(formatDurationInputValue(900, "mmss")).toBe("15:00")
  })

  it("parses valid mm:ss values", () => {
    expect(parseMinutesSeconds("15:00")).toBe(900)
    expect(parseMinutesSeconds("5:07")).toBe(307)
  })

  it("builds and normalizes a numeric mm:ss mask", () => {
    expect(formatDurationMaskValue("1")).toBe("1")
    expect(formatDurationMaskValue("123")).toBe("1:23")
    expect(formatDurationMaskValue("1234")).toBe("12:34")
    expect(normalizeDurationMaskValue("45")).toBe("00:45")
    expect(normalizeDurationMaskValue("1234")).toBe("12:34")
  })

  it("rejects invalid mm:ss values", () => {
    expect(parseMinutesSeconds("15:75")).toBeNull()
    expect(parseMinutesSeconds("abc")).toBeNull()
    expect(parseMinutesSeconds("0:00")).toBeNull()
  })
})
