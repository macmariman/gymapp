export type ExerciseMetricType = "reps" | "weight" | "time"
export type ExerciseLogType = "none" | "reps" | "weight" | "time"
export type ExerciseDurationFormat = "seconds" | "mmss"

export type RoutineSummary = {
  id: string
  name: string
  summary: string
  lastSessionAt: string | null
}

export type ExerciseView = {
  id: string
  movementId: string
  name: string
  targetType: ExerciseMetricType
  targetValue: number
  note?: string | null
  logType: ExerciseLogType
  durationFormat: ExerciseDurationFormat
  lastLogSummary: string | null
  lastLogValues: string[]
}

export type ExerciseGroupView = {
  id: string
  name: string
  series: number
  sectionName: string
  exercises: ExerciseView[]
}

export type RoutineSectionView = {
  id: string
  name: string
  groups: ExerciseGroupView[]
}

export type RoutineWithStructure = {
  id: string
  name: string
  summary: string
  lastSessionAt: string | null
  sections: RoutineSectionView[]
}

export type AttendanceMonth = {
  year: number
  month: number
  daysWithSessions: number[]
}

export type SessionExerciseSummary = {
  exerciseId: string
  exerciseName: string
  valueSummary: string
}

export type SessionHistoryEntry = {
  id: string
  routineId: string
  routineName: string
  performedAt: string
  note: string | null
  exercises: SessionExerciseSummary[]
}

export type CreateWorkoutSessionInput = {
  routineId: string
  note?: string
  setLogs: {
    exerciseId: string
    slotExerciseId?: string
    groupId?: string
    setNumber: number
    value: string
  }[]
}

export type WorkoutPageData = {
  routines: RoutineSummary[]
  routineDetails: RoutineWithStructure[]
  attendance: AttendanceMonth
  history: SessionHistoryEntry[]
}

export type ExerciseProgressMetricKey =
  | "maxLoad"
  | "totalVolume"
  | "bestSetReps"
  | "totalReps"
  | "longestSetSeconds"
  | "totalTimeSeconds"

export type ExerciseProgressRangeKey = "3m" | "6m" | "1y" | "all"

export type ExerciseProgressMetricOption = {
  key: ExerciseProgressMetricKey
  label: string
  shortLabel: string
  unit: string
}

export type ExerciseProgressMovement = {
  id: string
  slug: string
  name: string
  logType: Exclude<ExerciseLogType, "none">
  durationFormat: ExerciseDurationFormat
  detail: string
}

export type ExerciseProgressSessionSet = {
  setNumber: number
  value: number
  targetValue: number
}

export type ExerciseProgressSession = {
  id: string
  routineId: string
  routineName: string
  performedAt: string
  note: string | null
  setSummary: string
  sets: ExerciseProgressSessionSet[]
  metrics: Partial<Record<ExerciseProgressMetricKey, number>>
}

export type ExerciseProgressPageData = {
  movement: ExerciseProgressMovement
  availableMetrics: ExerciseProgressMetricOption[]
  sessions: ExerciseProgressSession[]
}

export type ProgressOverviewMetricMode = "best" | "volume"

export type ProgressOverviewSession = {
  id: string
  routineId: string
  routineName: string
  performedAt: string
  note: string | null
  bestValue: number | null
  volumeValue: number | null
}

export type ProgressOverviewMovement = {
  id: string
  slug: string
  name: string
  logType: Exclude<ExerciseLogType, "none">
  durationFormat: ExerciseDurationFormat
  sessions: ProgressOverviewSession[]
}

export type ProgressOverviewPageData = {
  movements: ProgressOverviewMovement[]
}
