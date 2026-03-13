export type ExerciseMetricType = 'reps' | 'weight' | 'time';
export type ExerciseLogType = 'none' | 'reps' | 'weight' | 'time';

export type RoutineSummary = {
  id: string;
  name: string;
  summary: string;
  lastSessionAt: string | null;
};

export type ExerciseView = {
  id: string;
  name: string;
  targetType: ExerciseMetricType;
  targetValue: number;
  note?: string | null;
  logType: ExerciseLogType;
  lastLogSummary: string | null;
  lastLogValues: string[];
};

export type ExerciseGroupView = {
  id: string;
  name: string;
  series: number;
  sectionName: string;
  exercises: ExerciseView[];
};

export type RoutineSectionView = {
  id: string;
  name: string;
  groups: ExerciseGroupView[];
};

export type RoutineWithStructure = {
  id: string;
  name: string;
  summary: string;
  lastSessionAt: string | null;
  sections: RoutineSectionView[];
};

export type AttendanceMonth = {
  year: number;
  month: number;
  daysWithSessions: number[];
};

export type SessionExerciseSummary = {
  exerciseId: string;
  exerciseName: string;
  valueSummary: string;
};

export type SessionHistoryEntry = {
  id: string;
  routineId: string;
  routineName: string;
  performedAt: string;
  note: string | null;
  exercises: SessionExerciseSummary[];
};

export type CreateWorkoutSessionInput = {
  routineId: string;
  note?: string;
  setLogs: {
    exerciseId: string;
    setNumber: number;
    value: string;
  }[];
};

export type WorkoutPageData = {
  routines: RoutineSummary[];
  routineDetails: RoutineWithStructure[];
  attendance: AttendanceMonth;
  history: SessionHistoryEntry[];
};
