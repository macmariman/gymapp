import {
  formatDurationWithFormat,
  formatLogSummary,
  formatTarget,
} from "@/lib/workouts/formatting"

describe("workout formatting", () => {
  it("formats mm:ss targets and summaries for cardio", () => {
    expect(formatDurationWithFormat(900, "mmss")).toBe("15:00")
    expect(formatLogSummary("time", [900], "mmss")).toBe("15:00")
    expect(
      formatTarget({
        targetType: "time",
        targetValue: 900,
        note: null,
        durationFormat: "mmss",
      })
    ).toBe("15:00")
  })

  it("pads short mm:ss durations when formatting from seconds", () => {
    expect(formatDurationWithFormat(307, "mmss")).toBe("05:07")
  })

  it("keeps seconds-based time formatting for existing exercises", () => {
    expect(formatDurationWithFormat(30, "seconds")).toBe("30 s")
    expect(formatLogSummary("time", [30], "seconds")).toBe("30 s")
  })
})
