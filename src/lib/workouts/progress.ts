import {
  formatDurationWithFormat,
  formatLogSummary,
  formatReps,
  formatSessionDate,
  formatWeight,
} from "@/lib/workouts/formatting"
import type {
  ExerciseDurationFormat,
  ExerciseLogType,
  ExerciseProgressMetricKey,
  ExerciseProgressMetricOption,
  ExerciseProgressRangeKey,
  ExerciseProgressSession,
  ProgressOverviewMetricMode,
  ProgressOverviewMovement,
  ProgressOverviewSession,
} from "@/lib/workouts/types"

const WEIGHT_METRICS: ExerciseProgressMetricOption[] = [
  {
    key: "maxLoad",
    label: "Carga máxima",
    shortLabel: "Carga",
    unit: "kg",
  },
  {
    key: "totalVolume",
    label: "Volumen",
    shortLabel: "Volumen",
    unit: "kg·rep",
  },
]

const REPS_METRICS: ExerciseProgressMetricOption[] = [
  {
    key: "bestSetReps",
    label: "Mejor serie",
    shortLabel: "Mejor serie",
    unit: "rep",
  },
  {
    key: "totalReps",
    label: "Reps totales",
    shortLabel: "Totales",
    unit: "rep",
  },
]

function getTimeMetrics(durationFormat: ExerciseDurationFormat) {
  return [
    {
      key: "longestSetSeconds",
      label: "Mayor tiempo",
      shortLabel: "Mayor tiempo",
      unit: durationFormat === "mmss" ? "mm:ss" : "s",
    },
    {
      key: "totalTimeSeconds",
      label: "Tiempo total",
      shortLabel: "Tiempo total",
      unit: durationFormat === "mmss" ? "mm:ss" : "s",
    },
  ] satisfies ExerciseProgressMetricOption[]
}

function getMetricFormatter(
  metricKey: ExerciseProgressMetricKey,
  durationFormat: ExerciseDurationFormat = "seconds"
) {
  if (metricKey === "maxLoad") {
    return formatWeight
  }

  if (metricKey === "bestSetReps" || metricKey === "totalReps") {
    return formatReps
  }

  if (metricKey === "longestSetSeconds" || metricKey === "totalTimeSeconds") {
    return (value: string | number) =>
      formatDurationWithFormat(value, durationFormat)
  }

  return (value: string | number) => {
    const parsedValue = typeof value === "string" ? Number(value) : value
    return `${new Intl.NumberFormat("es-UY", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(parsedValue)} kg·rep`
  }
}

export function getMovementDetail(logType: Exclude<ExerciseLogType, "none">) {
  if (logType === "weight") {
    return "Seguimiento por carga"
  }

  if (logType === "time") {
    return "Seguimiento por tiempo"
  }

  return "Seguimiento por repeticiones"
}

export function getAvailableProgressMetrics(
  logType: ExerciseLogType,
  durationFormat: ExerciseDurationFormat = "seconds"
) {
  if (logType === "weight") {
    return WEIGHT_METRICS
  }

  if (logType === "time") {
    return getTimeMetrics(durationFormat)
  }

  return REPS_METRICS
}

export function getDefaultProgressMetric(logType: ExerciseLogType) {
  return getAvailableProgressMetrics(logType)[0]?.key ?? "bestSetReps"
}

export function getMetricValue(
  session: Pick<ExerciseProgressSession, "metrics">,
  metricKey: ExerciseProgressMetricKey
) {
  return session.metrics[metricKey] ?? null
}

export function formatProgressMetricValue(
  metricKey: ExerciseProgressMetricKey,
  value: number | null,
  durationFormat: ExerciseDurationFormat = "seconds"
) {
  if (value === null) {
    return "Sin datos"
  }

  return getMetricFormatter(metricKey, durationFormat)(value)
}

export function getProgressOverviewMetricValue(
  session: ProgressOverviewSession,
  metricMode: ProgressOverviewMetricMode
) {
  return metricMode === "best" ? session.bestValue : session.volumeValue
}

export function formatProgressOverviewMetricValue(
  movement: Pick<ProgressOverviewMovement, "logType" | "durationFormat">,
  metricMode: ProgressOverviewMetricMode,
  value: number | null
) {
  if (value === null) {
    return "Sin datos"
  }

  if (metricMode === "volume") {
    if (movement.logType === "weight") {
      return `${new Intl.NumberFormat("es-UY", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value)} kg·rep`
    }

    if (movement.logType === "time") {
      return formatDurationWithFormat(value, movement.durationFormat)
    }

    return formatReps(value)
  }

  if (movement.logType === "weight") {
    return formatWeight(value)
  }

  if (movement.logType === "time") {
    return formatDurationWithFormat(value, movement.durationFormat)
  }

  return formatReps(value)
}

export function getProgressChangePercent(values: number[]) {
  const comparableValues = values.filter((value) => Number.isFinite(value))

  if (comparableValues.length < 2) {
    return null
  }

  const firstValue = comparableValues[0]
  const lastValue = comparableValues[comparableValues.length - 1]

  if (firstValue === 0) {
    return null
  }

  return ((lastValue - firstValue) / firstValue) * 100
}

export function formatProgressChangePercent(value: number | null) {
  if (value === null) {
    return "Sin comparación"
  }

  const formattedValue = new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(value)

  return `${formattedValue}%`
}

export function buildNormalizedProgressSeries(
  movement: ProgressOverviewMovement,
  metricMode: ProgressOverviewMetricMode
) {
  const sessions = movement.sessions
    .map((session) => ({
      ...session,
      value: getProgressOverviewMetricValue(session, metricMode),
    }))
    .filter(
      (session): session is typeof session & { value: number } =>
        session.value !== null
    )

  const firstValue = sessions[0]?.value

  if (!firstValue) {
    return []
  }

  return sessions.map((session) => ({
    id: `${movement.id}:${session.id}`,
    movementId: movement.id,
    sessionId: session.id,
    performedAt: session.performedAt,
    routineName: session.routineName,
    rawValue: session.value,
    normalizedValue: (session.value / firstValue) * 100,
  }))
}

export function getRangeLabel(range: ExerciseProgressRangeKey) {
  if (range === "3m") {
    return "3 m"
  }

  if (range === "6m") {
    return "6 m"
  }

  if (range === "1y") {
    return "1 año"
  }

  return "Todo"
}

export function filterSessionsByRange<T extends { performedAt: string }>(
  sessions: T[],
  range: ExerciseProgressRangeKey,
  now = new Date()
) {
  if (range === "all") {
    return sessions
  }

  const startDate = new Date(now)

  if (range === "3m") {
    startDate.setMonth(startDate.getMonth() - 3)
  } else if (range === "6m") {
    startDate.setMonth(startDate.getMonth() - 6)
  } else {
    startDate.setFullYear(startDate.getFullYear() - 1)
  }

  return sessions.filter(
    (session) => new Date(session.performedAt) >= startDate
  )
}

export function buildSessionSetSummary(
  logType: Exclude<ExerciseLogType, "none">,
  values: number[],
  durationFormat: ExerciseDurationFormat = "seconds"
) {
  return formatLogSummary(logType, values, durationFormat)
}

export function getRecordValue(
  sessions: ExerciseProgressSession[],
  metricKey: ExerciseProgressMetricKey
) {
  let recordValue: number | null = null

  for (const session of sessions) {
    const value = getMetricValue(session, metricKey)

    if (value === null) {
      continue
    }

    if (recordValue === null || value > recordValue) {
      recordValue = value
    }
  }

  return recordValue
}

export function getLastImprovementSession(
  sessions: ExerciseProgressSession[],
  metricKey: ExerciseProgressMetricKey
) {
  let recordValue = -Infinity
  let lastImprovementSession: ExerciseProgressSession | null = null

  for (const session of sessions) {
    const value = getMetricValue(session, metricKey)

    if (value === null || value <= recordValue) {
      continue
    }

    recordValue = value
    lastImprovementSession = session
  }

  return lastImprovementSession
}

export function getSessionsSinceImprovement(
  sessions: ExerciseProgressSession[],
  metricKey: ExerciseProgressMetricKey
) {
  const lastImprovementSession = getLastImprovementSession(sessions, metricKey)

  if (!lastImprovementSession) {
    return null
  }

  const lastImprovementIndex = sessions.findIndex(
    (session) => session.id === lastImprovementSession.id
  )

  if (lastImprovementIndex === -1) {
    return null
  }

  return sessions.length - lastImprovementIndex - 1
}

export function getLastMetricValue(
  sessions: ExerciseProgressSession[],
  metricKey: ExerciseProgressMetricKey
) {
  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    const value = getMetricValue(sessions[index], metricKey)

    if (value !== null) {
      return value
    }
  }

  return null
}

export function getTrendLabel(
  sessions: ExerciseProgressSession[],
  metricKey: ExerciseProgressMetricKey
) {
  const values = sessions
    .map((session) => getMetricValue(session, metricKey))
    .filter((value): value is number => value !== null)

  if (values.length < 6) {
    return "Historial insuficiente"
  }

  const recentAverage =
    values.slice(-3).reduce((total, value) => total + value, 0) / 3
  const previousAverage =
    values.slice(-6, -3).reduce((total, value) => total + value, 0) / 3

  if (previousAverage === 0) {
    return "Estable"
  }

  const delta = (recentAverage - previousAverage) / previousAverage

  if (delta >= 0.05) {
    return "Subiendo"
  }

  if (delta <= -0.05) {
    return "Bajando"
  }

  return "Estable"
}

export function formatImprovementDate(value: string | null, now = new Date()) {
  if (!value) {
    return "Sin mejora registrada"
  }

  const targetDate = new Date(value)
  const diffInDays = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      )) /
      (1000 * 60 * 60 * 24)
  )

  if (diffInDays <= 0) {
    return "Hoy"
  }

  if (diffInDays === 1) {
    return "Hace 1 día"
  }

  return `Hace ${diffInDays} días`
}

export function formatChartDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
  }).format(new Date(value))
}

export function formatHistoryDateLabel(value: string) {
  return formatSessionDate(value)
}
