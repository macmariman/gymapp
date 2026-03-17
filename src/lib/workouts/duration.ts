import type { ExerciseDurationFormat } from "@/lib/workouts/types"

const MMSS_PATTERN = /^(\d{1,3}):(\d{2})$/
const MAX_MMSS_DIGITS = 4

function getDurationMaskDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, MAX_MMSS_DIGITS)
}

export function parseMinutesSeconds(value: string) {
  const trimmedValue = value.trim()
  const match = trimmedValue.match(MMSS_PATTERN)

  if (!match) {
    return null
  }

  const minutes = Number(match[1])
  const seconds = Number(match[2])

  if (
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    seconds > 59
  ) {
    return null
  }

  const totalSeconds = minutes * 60 + seconds

  return totalSeconds > 0 ? totalSeconds : null
}

export function formatMinutesSeconds(totalSeconds: string | number) {
  const parsedValue =
    typeof totalSeconds === "string" ? Number(totalSeconds) : totalSeconds
  const minutes = Math.floor(parsedValue / 60)
  const seconds = parsedValue % 60

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function formatDurationInputValue(
  totalSeconds: string | number,
  durationFormat: ExerciseDurationFormat
) {
  if (durationFormat === "mmss") {
    return formatMinutesSeconds(totalSeconds)
  }

  const parsedValue =
    typeof totalSeconds === "string" ? Number(totalSeconds) : totalSeconds

  return String(parsedValue)
}

export function formatDurationMaskValue(value: string) {
  const digits = getDurationMaskDigits(value)

  if (digits.length === 0) {
    return ""
  }

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, -2)}:${digits.slice(-2)}`
}

export function normalizeDurationMaskValue(value: string) {
  const digits = getDurationMaskDigits(value)

  if (digits.length === 0) {
    return ""
  }

  const paddedDigits = digits.padStart(MAX_MMSS_DIGITS, "0")

  return `${paddedDigits.slice(0, 2)}:${paddedDigits.slice(2)}`
}
