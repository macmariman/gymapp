export type QuickNoteOption = {
  label: string
  value: string
}

export const exerciseQuickNoteOptions = [
  { label: "Subir peso", value: "subir peso" },
  { label: "Repetir peso", value: "repetir peso" },
  { label: "Bajar peso", value: "bajar peso" },
  { label: "Costó completar", value: "costó completar" },
  { label: "Dolor/molestia", value: "dolor/molestia" },
  { label: "Ajustar técnica", value: "ajustar técnica" },
] as const satisfies QuickNoteOption[]

export const sessionQuickNoteOptions = [
  { label: "Dormí poco", value: "dormí poco" },
  { label: "Fatiga alta", value: "fatiga alta" },
  { label: "Poca energía", value: "poca energía" },
  { label: "Buen rendimiento", value: "buen rendimiento" },
  { label: "Entrené apurado", value: "entrené apurado" },
  { label: "Estrés alto", value: "estrés alto" },
] as const satisfies QuickNoteOption[]

const sessionNotePrefix = "Sesión -"
const exerciseQuickNoteLabelByValue = new Map<string, string>(
  exerciseQuickNoteOptions.map((option) => [option.value, option.label])
)
const sessionQuickNoteLabelByValue = new Map<string, string>(
  sessionQuickNoteOptions.map((option) => [option.value, option.label])
)

function ensureSentence(value: string) {
  const trimmedValue = value.trim()

  if (trimmedValue.length === 0) {
    return ""
  }

  return /[.!?]$/.test(trimmedValue) ? trimmedValue : `${trimmedValue}.`
}

function formatChip(value: string, labelByValue: Map<string, string>) {
  const normalizedValue = value.trim().toLowerCase()
  const label = labelByValue.get(normalizedValue)

  return label ? `[${label}]` : `[${value.trim()}]`
}

function getChipValues(line: string) {
  return Array.from(line.matchAll(/\[([^\]]+)\]/g)).map((match) =>
    match[1].trim().toLowerCase()
  )
}

function rebuildSessionLine(labels: string[]) {
  return `${sessionNotePrefix} ${labels.map((label) => `[${label}]`).join(" ")}`
}

export function appendNoteLine(currentNote: string, line: string) {
  const nextLine = line.trim()

  if (nextLine.length === 0) {
    return currentNote
  }

  if (currentNote.trim().length === 0) {
    return nextLine
  }

  return `${currentNote.trimEnd()}\n\n${nextLine}`
}

export function formatExerciseQuickNote(
  exerciseName: string,
  selectedValues: string[],
  detail: string
) {
  const chips = selectedValues
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => formatChip(value, exerciseQuickNoteLabelByValue))
    .join(" ")
  const detailSentence = ensureSentence(detail)

  if (chips.length === 0 && detailSentence.length === 0) {
    return ""
  }

  if (chips.length === 0) {
    return `${exerciseName} - ${detailSentence}`
  }

  if (detailSentence.length === 0) {
    return `${exerciseName} - ${chips}`
  }

  return `${exerciseName} - ${chips} - ${detailSentence}`
}

export function appendGlobalSessionContext(
  currentNote: string,
  selectedValue: string
) {
  const normalizedValue = selectedValue.trim().toLowerCase()

  if (normalizedValue.length === 0) {
    return currentNote
  }

  const lines = currentNote.split("\n")
  const sessionLineIndex = lines.findIndex((line) =>
    line.trimStart().startsWith(sessionNotePrefix)
  )

  if (sessionLineIndex === -1) {
    return appendNoteLine(
      currentNote,
      `${sessionNotePrefix} ${formatChip(
        normalizedValue,
        sessionQuickNoteLabelByValue
      )}`
    )
  }

  const sessionLine = lines[sessionLineIndex]
  const sessionContext = getChipValues(sessionLine)
  const selectedChip = formatChip(normalizedValue, sessionQuickNoteLabelByValue)
  const selectedLabel =
    sessionQuickNoteLabelByValue.get(normalizedValue)?.toLowerCase() ??
    normalizedValue

  if (sessionContext.includes(selectedLabel)) {
    const nextLabels = sessionContext
      .filter((value) => value !== selectedLabel)
      .map(
        (value) =>
          sessionQuickNoteOptions.find(
            (option) => option.label.toLowerCase() === value
          )?.label ?? value
      )

    return nextLabels.length === 0
      ? lines
          .filter((_, lineIndex) => lineIndex !== sessionLineIndex)
          .join("\n")
          .trim()
      : lines
          .map((line, lineIndex) =>
            lineIndex === sessionLineIndex
              ? rebuildSessionLine(nextLabels)
              : line
          )
          .join("\n")
  }

  lines[sessionLineIndex] = `${sessionLine.trimEnd()} ${selectedChip}`

  return lines.join("\n")
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function findLastExerciseNote(
  note: string,
  exerciseName: string
): string | null {
  const trimmedName = exerciseName.trim()

  if (trimmedName.length === 0 || note.trim().length === 0) {
    return null
  }

  const prefixPattern = new RegExp(`^${escapeRegExp(trimmedName)}\\s-\\s`)
  const lines = note.split("\n")

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index].trim()

    if (prefixPattern.test(line)) {
      return line.replace(prefixPattern, "").trim()
    }
  }

  return null
}

export function getUsedSessionQuickNoteValues(currentNote: string) {
  const sessionLine = currentNote
    .split("\n")
    .find((line) => line.trimStart().startsWith(sessionNotePrefix))

  if (!sessionLine) {
    return new Set<string>()
  }

  const usedLabels = new Set(getChipValues(sessionLine))

  return new Set(
    sessionQuickNoteOptions
      .filter((option) => usedLabels.has(option.label.toLowerCase()))
      .map((option) => option.value)
  )
}
