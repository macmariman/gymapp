import type { AttendanceMonth, ExerciseLogType, ExerciseView } from '@/lib/workouts/types';

const weightFormatter = new Intl.NumberFormat('es-UY', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export function formatTarget(exercise: Pick<ExerciseView, 'targetType' | 'targetValue' | 'note'>) {
  const unit = exercise.targetType === 'time' ? 's' : exercise.targetType === 'weight' ? 'kg' : 'rep';
  return `${exercise.targetValue} ${unit}${exercise.note ? ` ${exercise.note}` : ''}`;
}

export function formatWeight(weight: string | number) {
  const parsedWeight = typeof weight === 'string' ? Number(weight) : weight;
  return `${weightFormatter.format(parsedWeight)} kg`;
}

export function formatReps(value: string | number) {
  const parsedValue = typeof value === 'string' ? Number(value) : value;
  return `${weightFormatter.format(parsedValue)} rep`;
}

export function formatDuration(seconds: string | number) {
  const parsedValue = typeof seconds === 'string' ? Number(seconds) : seconds;
  return `${weightFormatter.format(parsedValue)} s`;
}

export function formatLoggedValue(logType: ExerciseLogType, value: string | number) {
  if (logType === 'weight') {
    return formatWeight(value);
  }

  if (logType === 'time') {
    return formatDuration(value);
  }

  return formatReps(value);
}

export function formatWeightSummary(weights: Array<string | number>) {
  return weights.map((weight) => formatWeight(weight)).join(' / ');
}

export function formatLogSummary(logType: Exclude<ExerciseLogType, 'none'>, values: Array<string | number>) {
  const unit = logType === 'weight' ? 'kg' : logType === 'time' ? 's' : 'rep';
  const formattedValues = values.map((value) => {
    const parsed = typeof value === 'string' ? Number(value) : value;
    return weightFormatter.format(parsed);
  });
  return `${formattedValues.join(' · ')} ${unit}`;
}

export function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
}

export function formatRelativeSessionDate(value: string | null) {
  if (!value) {
    return 'Sin sesiones todavía';
  }

  const now = new Date();
  const targetDate = new Date(value);
  const diffInDays = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())) /
      (1000 * 60 * 60 * 24)
  );

  if (diffInDays <= 0) {
    return 'Hoy';
  }

  if (diffInDays === 1) {
    return 'Ayer';
  }

  return `Hace ${diffInDays} días`;
}

export function buildAttendanceGrid(attendance: AttendanceMonth) {
  const firstDay = new Date(Date.UTC(attendance.year, attendance.month - 1, 1));
  const totalDays = new Date(Date.UTC(attendance.year, attendance.month, 0)).getUTCDate();
  const weekStartsOnMonday = (firstDay.getUTCDay() + 6) % 7;
  const cells: Array<{ day: number | null; completed: boolean }> = [];

  for (let index = 0; index < weekStartsOnMonday; index += 1) {
    cells.push({ day: null, completed: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      day,
      completed: attendance.daysWithSessions.includes(day)
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, completed: false });
  }

  return cells;
}
