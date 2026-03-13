'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronRight, Clock3, Dumbbell, NotebookPen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  buildAttendanceGrid,
  formatRelativeSessionDate,
  formatSessionDate,
  formatTarget
} from '@/lib/workouts/formatting';
import type {
  ExerciseGroupView,
  RoutineSummary,
  RoutineWithStructure,
  WorkoutPageData
} from '@/lib/workouts/types';

const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

type SubmissionState =
  | { type: 'idle'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

function buildWeightInputKey(exerciseId: string, setNumber: number) {
  return `${exerciseId}:${setNumber}`;
}

function getDefaultGroupId(routine: RoutineWithStructure | undefined) {
  if (!routine) {
    return '';
  }

  const weightedGroup = routine.sections
    .flatMap((section) => section.groups)
    .find((group) => group.exercises.some((exercise) => exercise.tracksWeight));

  return weightedGroup?.id ?? routine.sections[0]?.groups[0]?.id ?? '';
}

function RoutineList({
  routines,
  selectedRoutineId,
  onSelect
}: {
  routines: RoutineSummary[];
  selectedRoutineId: string;
  onSelect: (routineId: string) => void;
}) {
  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-5">
        <CardTitle className="text-xl text-slate-950">Rutinas</CardTitle>
        <CardDescription>Tu plan fijo cargado desde la base.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        {routines.map((routine) => (
          <button
            key={routine.id}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
              routine.id === selectedRoutineId
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
            )}
            onClick={() => onSelect(routine.id)}
            type="button"
          >
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-950">{routine.name}</div>
              <div className="text-xs text-slate-500">{routine.summary}</div>
              <div className="text-xs text-slate-600">
                {formatRelativeSessionDate(routine.lastSessionAt)}
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-400" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function AttendanceCard({ attendance }: Pick<WorkoutPageData, 'attendance'>) {
  const cells = buildAttendanceGrid(attendance);

  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-5">
        <CardTitle className="text-xl text-slate-950">Asistencia</CardTitle>
        <CardDescription>Los días marcados salen de sesiones reales guardadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-950">
              {new Intl.DateTimeFormat('es-UY', { month: 'long', year: 'numeric' }).format(
                new Date(attendance.year, attendance.month - 1, 1)
              )}
            </div>
            <div className="text-xs text-slate-500">Asistencia del mes actual</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-slate-950">
              {attendance.daysWithSessions.length}
            </div>
            <div className="text-xs text-slate-500">sesiones</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 grid grid-cols-7 gap-2">
            {weekDays.map((label) => (
              <div
                key={label}
                className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, index) =>
              cell.day ? (
                <div
                  key={`${cell.day}-${index}`}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-2xl text-sm font-semibold',
                    cell.completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {cell.day}
                </div>
              ) : (
                <div key={`empty-${index}`} className="aspect-square rounded-2xl bg-transparent" />
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseSummary({
  exercise
}: {
  exercise: ExerciseGroupView['exercises'][number];
}) {
  return (
    <div className="space-y-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-sm font-medium text-slate-950">{exercise.name}</div>
      <div className="text-xs text-slate-500">{formatTarget(exercise)}</div>
      <div className="text-xs text-slate-600">
        {exercise.tracksWeight
          ? exercise.lastWeightSummary
            ? `Último: ${exercise.lastWeightSummary}`
            : 'Sin registro todavía'
          : 'Objetivo fijo'}
      </div>
    </div>
  );
}

function RoutineDetail({
  routine,
  activeGroupId,
  onSelectGroup
}: {
  routine: RoutineWithStructure;
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
}) {
  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-slate-950">{routine.name}</CardTitle>
            <CardDescription>{routine.summary}</CardDescription>
          </div>
          <Badge className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-900">
            {formatRelativeSessionDate(routine.lastSessionAt)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-5">
        {routine.sections.map((section) => (
          <div key={section.id} className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">
              {section.name}
            </div>
            {section.groups.map((group) => (
              <button
                key={group.id}
                className={cn(
                  'w-full rounded-[24px] border p-4 text-left transition',
                  group.id === activeGroupId
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                )}
                onClick={() => onSelectGroup(group.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">{group.name}</div>
                    <div className="text-xs text-slate-500">{group.series} series</div>
                  </div>
                  {group.exercises.some((exercise) => exercise.tracksWeight) ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-200 bg-white text-emerald-700"
                    >
                      Registrar
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 space-y-3">
                  {group.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="space-y-3">
                      <ExerciseSummary exercise={exercise} />
                      {index < group.exercises.length - 1 ? (
                        <Separator className="bg-slate-200" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SessionHistory({ history }: Pick<WorkoutPageData, 'history'>) {
  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-5">
        <CardTitle className="text-xl text-slate-950">Historial</CardTitle>
        <CardDescription>Sesiones guardadas. Solo lectura en esta versión.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Todavía no hay sesiones guardadas.
          </div>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">{entry.routineName}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays className="size-3.5" />
                    {formatSessionDate(entry.performedAt)}
                  </div>
                </div>
                {entry.note ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-300 bg-white text-slate-700"
                  >
                    Con nota
                  </Badge>
                ) : null}
              </div>
              {entry.note ? (
                <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  {entry.note}
                </div>
              ) : null}
              <div className="mt-3 space-y-2">
                {entry.exercises.length === 0 ? (
                  <div className="text-sm text-slate-500">Sin pesos registrados.</div>
                ) : (
                  entry.exercises.map((exercise) => (
                    <div
                      key={`${entry.id}-${exercise.exerciseId}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3"
                    >
                      <div className="text-sm text-slate-700">{exercise.exerciseName}</div>
                      <div className="text-sm font-medium text-slate-950">
                        {exercise.weightSummary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SessionPanel({
  routine,
  activeGroup,
  note,
  status,
  isPending,
  weights,
  onNoteChange,
  onWeightChange,
  onSubmit
}: {
  routine: RoutineWithStructure;
  activeGroup: ExerciseGroupView | undefined;
  note: string;
  status: SubmissionState;
  isPending: boolean;
  weights: Record<string, string>;
  onNoteChange: (value: string) => void;
  onWeightChange: (key: string, value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  const weightedExercises = activeGroup?.exercises.filter((exercise) => exercise.tracksWeight) ?? [];
  const canSubmit = weightedExercises.length > 0;

  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-slate-950">Sesión</CardTitle>
            <CardDescription>
              Guarda una sesión real con pesos por serie y una nota opcional.
            </CardDescription>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-800">
            <Dumbbell className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        {activeGroup ? (
          <>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">{routine.name}</div>
              <div className="mt-1 text-xs text-slate-500">
                {activeGroup.sectionName} · {activeGroup.name} · {activeGroup.series} series
              </div>
            </div>

            {activeGroup.exercises.map((exercise, index) => (
              <div key={exercise.id} className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-950">{exercise.name}</div>
                  <div className="text-xs text-slate-500">{formatTarget(exercise)}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock3 className="size-3.5 text-slate-400" />
                    {exercise.tracksWeight
                      ? exercise.lastWeightSummary
                        ? `Último: ${exercise.lastWeightSummary}`
                        : 'Sin registro todavía'
                      : 'Este ejercicio no registra peso'}
                  </div>
                </div>

                {exercise.tracksWeight ? (
                  <div className="space-y-2">
                    {Array.from({ length: activeGroup.series }, (_, index) => {
                      const setNumber = index + 1;
                      const inputKey = buildWeightInputKey(exercise.id, setNumber);

                      return (
                        <label
                          key={inputKey}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <span className="text-sm font-medium text-slate-700">Serie {setNumber}</span>
                          <input
                            className="h-10 w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 text-right text-sm font-semibold text-slate-950 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                            inputMode="decimal"
                            onChange={(event) => onWeightChange(inputKey, event.target.value)}
                            placeholder="kg"
                            value={weights[inputKey] ?? ''}
                          />
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Objetivo fijo: {formatTarget(exercise)}
                  </div>
                )}

                {index < activeGroup.exercises.length - 1 ? (
                  <Separator className="bg-slate-200" />
                ) : null}
              </div>
            ))}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <NotebookPen className="size-4" />
                Nota de la sesión
              </label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                maxLength={500}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Opcional. Cómo te sentiste, ajustes o algo a recordar."
                value={note}
              />
            </div>

            <div
              className={cn(
                'rounded-2xl border px-4 py-3 text-sm',
                status.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : status.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
              )}
            >
              {status.message}
            </div>

            <Button
              className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canSubmit || isPending}
              onClick={() => {
                void onSubmit();
              }}
              type="button"
            >
              {isPending ? 'Guardando...' : 'Guardar sesión'}
            </Button>
            {!canSubmit ? (
              <div className="text-xs text-slate-500">
                Elegí un bloque con ejercicios de fuerza para registrar pesos.
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hay bloques disponibles para esta rutina.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkoutApp({
  routines,
  routineDetails,
  attendance,
  history
}: WorkoutPageData) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRoutineId, setSelectedRoutineId] = useState(routines[0]?.id ?? '');
  const [activeGroupId, setActiveGroupId] = useState(() => getDefaultGroupId(routineDetails[0]));
  const [note, setNote] = useState('');
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SubmissionState>({
    type: 'idle',
    message: 'Guardá una sesión para actualizar asistencia, últimos pesos e historial.'
  });

  const selectedRoutine = routineDetails.find((routine) => routine.id === selectedRoutineId) ?? routineDetails[0];
  const allGroups = selectedRoutine?.sections.flatMap((section) => section.groups) ?? [];
  const defaultGroupId = getDefaultGroupId(selectedRoutine);
  const activeGroup = allGroups.find((group) => group.id === activeGroupId);
  const activeGroupExists = Boolean(activeGroup);

  useEffect(() => {
    if (!defaultGroupId || activeGroupExists) {
      return;
    }

    setActiveGroupId(defaultGroupId);
  }, [activeGroupExists, defaultGroupId]);

  useEffect(() => {
    setActiveGroupId(defaultGroupId);
    setWeights({});
    setNote('');
    setStatus({
      type: 'idle',
      message: 'Guardá una sesión para actualizar asistencia, últimos pesos e historial.'
    });
  }, [defaultGroupId, selectedRoutineId]);

  async function handleSubmit() {
    if (!selectedRoutine || !activeGroup) {
      return;
    }

    const setLogs = activeGroup.exercises.flatMap((exercise) => {
      if (!exercise.tracksWeight) {
        return [];
      }

      return Array.from({ length: activeGroup.series }, (_, index) => {
        const setNumber = index + 1;
        const key = buildWeightInputKey(exercise.id, setNumber);
        const value = weights[key]?.trim();

        if (!value) {
          return null;
        }

        return {
          exerciseId: exercise.id,
          setNumber,
          weightKg: value
        };
      }).filter(Boolean) as Array<{
        exerciseId: string;
        setNumber: number;
        weightKg: string;
      }>;
    });

    if (setLogs.length === 0) {
      setStatus({
        type: 'error',
        message: 'Ingresá al menos un peso antes de guardar la sesión.'
      });
      return;
    }

    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          routineId: selectedRoutine.id,
          note,
          setLogs
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? 'No se pudo guardar la sesión.');
      }

      setWeights({});
      setNote('');
      setStatus({
        type: 'success',
        message: 'Sesión guardada correctamente.'
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo guardar la sesión.'
      });
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 space-y-2">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
          Gym App
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
          Tu rutina y tus sesiones en un solo lugar.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Elegís una rutina, registrás los pesos que hiciste y ves tu asistencia real del mes.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-4">
          <RoutineList
            onSelect={setSelectedRoutineId}
            routines={routines}
            selectedRoutineId={selectedRoutineId}
          />
          <AttendanceCard attendance={attendance} />
        </div>

        <div className="grid gap-4">
          {selectedRoutine ? (
            <>
              <RoutineDetail
                activeGroupId={activeGroupId}
                onSelectGroup={setActiveGroupId}
                routine={selectedRoutine}
              />
              <SessionPanel
                activeGroup={activeGroup}
                isPending={isPending}
                note={note}
                onNoteChange={setNote}
                onSubmit={handleSubmit}
                onWeightChange={(key, value) =>
                  setWeights((currentWeights) => ({
                    ...currentWeights,
                    [key]: value
                  }))
                }
                routine={selectedRoutine}
                status={status}
                weights={weights}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <SessionHistory history={history} />
      </div>
    </main>
  );
}
