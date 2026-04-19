"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BarChart3, ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  buildNormalizedProgressSeries,
  filterSessionsByRange,
  formatChartDateLabel,
  formatProgressChangePercent,
  formatProgressOverviewMetricValue,
  getProgressChangePercent,
  getProgressOverviewMetricValue,
  getRangeLabel,
} from "@/lib/workouts/progress"
import type {
  ExerciseProgressRangeKey,
  ProgressOverviewMetricMode,
  ProgressOverviewMovement,
  ProgressOverviewPageData,
} from "@/lib/workouts/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const RANGE_OPTIONS: ExerciseProgressRangeKey[] = ["3m", "6m", "1y", "all"]
const ALL_ROUTINES_KEY = "all"
const METRIC_OPTIONS: Array<{
  value: ProgressOverviewMetricMode
  label: string
}> = [
  {
    value: "best",
    label: "Mejor registro",
  },
  {
    value: "volume",
    label: "Volumen total",
  },
]
const CHART_WIDTH = 520
const CHART_HEIGHT = 260
const CHART_PADDING = {
  top: 24,
  right: 24,
  bottom: 36,
  left: 42,
}
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

type OverviewPoint = {
  id: string
  movementId: string
  sessionId: string
  performedAt: string
  routineName: string
  rawValue: number
  normalizedValue: number
  x: number
  y: number
}

type OverviewSeries = {
  movement: ProgressOverviewMovement
  color: string
  points: OverviewPoint[]
  percentChange: number | null
  lastValue: number | null
  visibleSessionCount: number
  isActive: boolean
  isMuted: boolean
}

function getChartValueBounds(values: number[]) {
  const rawMinValue = Math.min(...values)
  const rawMaxValue = Math.max(...values)
  const valueSpread = rawMaxValue - rawMinValue
  const minValue = Math.max(
    0,
    valueSpread === 0 ? rawMinValue * 0.9 : rawMinValue - valueSpread * 0.15
  )
  const maxValue =
    valueSpread === 0
      ? rawMaxValue * 1.1 || rawMaxValue + 1
      : rawMaxValue + valueSpread * 0.15

  return {
    minValue,
    maxValue,
    rawMinValue,
    rawMaxValue,
  }
}

function getChartY(value: number, minValue: number, maxValue: number) {
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const normalizedValue =
    maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue)

  return CHART_PADDING.top + innerHeight - normalizedValue * innerHeight
}

function ProgressSegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            className={cn(
              "min-h-9 rounded-md border-2 px-3 py-1.5 text-sm font-bold transition",
              isActive
                ? "border-border bg-accent text-accent-foreground shadow-brutal"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function formatNormalizedDelta(value: number) {
  return formatProgressChangePercent(value - 100)
}

function buildOverviewSeries({
  activeMovementIds,
  highlightedMovementId,
  metricMode,
  movements,
  selectedRange,
}: {
  activeMovementIds: string[]
  highlightedMovementId: string | null
  metricMode: ProgressOverviewMetricMode
  movements: ProgressOverviewMovement[]
  selectedRange: ExerciseProgressRangeKey
}) {
  const activeMovementIdSet = new Set(activeMovementIds)
  const filteredMovements = movements
    .map((movement, index) => ({
      movement,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .map((item) => ({
      ...item,
      movement: {
        ...item.movement,
        sessions: filterSessionsByRange(item.movement.sessions, selectedRange),
      },
    }))

  const rawSeries = filteredMovements.map((item) => {
    const { color, movement } = item
    const values = movement.sessions
      .map((session) => getProgressOverviewMetricValue(session, metricMode))
      .filter((value): value is number => value !== null)
    const points = buildNormalizedProgressSeries(movement, metricMode)

    return {
      movement,
      color,
      points,
      percentChange: getProgressChangePercent(values),
      lastValue: values[values.length - 1] ?? null,
      visibleSessionCount: points.length,
      isActive: activeMovementIdSet.has(movement.id),
      isMuted:
        highlightedMovementId !== null && highlightedMovementId !== movement.id,
    }
  })

  const allPoints = rawSeries
    .filter((series) => series.isActive)
    .flatMap((series) => series.points)

  if (allPoints.length === 0) {
    return rawSeries.map((series) => ({
      ...series,
      points: [],
    }))
  }

  const timestamps = allPoints.map((point) =>
    new Date(point.performedAt).getTime()
  )
  const minTimestamp = Math.min(...timestamps)
  const maxTimestamp = Math.max(...timestamps)
  const { minValue, maxValue } = getChartValueBounds(
    allPoints.map((point) => point.normalizedValue)
  )
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right

  return rawSeries.map((series) => {
    return {
      ...series,
      points: series.isActive
        ? series.points.map((point) => {
            const timestamp = new Date(point.performedAt).getTime()
            const x =
              minTimestamp === maxTimestamp
                ? CHART_PADDING.left + innerWidth / 2
                : CHART_PADDING.left +
                  ((timestamp - minTimestamp) / (maxTimestamp - minTimestamp)) *
                    innerWidth
            const y = getChartY(point.normalizedValue, minValue, maxValue)

            return {
              ...point,
              x,
              y,
            }
          })
        : [],
    }
  })
}

function ProgressOverviewChart({
  activePointId,
  onSelectPoint,
  series,
}: {
  activePointId: string | null
  onSelectPoint: (pointId: string) => void
  series: OverviewSeries[]
}) {
  const visibleSeries = series.filter(
    (item) => item.isActive && item.points.length > 0
  )
  const allPoints = visibleSeries.flatMap((item) => item.points)

  if (allPoints.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-8 text-center text-sm text-muted-foreground">
        No hay sesiones en el rango seleccionado.
      </div>
    )
  }

  const timestamps = allPoints.map((point) =>
    new Date(point.performedAt).getTime()
  )
  const minAxisTimestamp = Math.min(...timestamps)
  const maxAxisTimestamp = Math.max(...timestamps)
  const axisDates =
    minAxisTimestamp === maxAxisTimestamp
      ? [
          {
            timestamp: minAxisTimestamp,
            textAnchor: "middle" as const,
            x:
              CHART_PADDING.left +
              (CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) / 2,
          },
        ]
      : [
          {
            timestamp: minAxisTimestamp,
            textAnchor: "start" as const,
            x: CHART_PADDING.left,
          },
          {
            timestamp: maxAxisTimestamp,
            textAnchor: "end" as const,
            x: CHART_WIDTH - CHART_PADDING.right,
          },
        ]
  const { minValue, maxValue, rawMinValue, rawMaxValue } = getChartValueBounds(
    allPoints.map((point) => point.normalizedValue)
  )
  const axisValues = [...new Set([rawMinValue, 100, rawMaxValue])]
    .sort((left, right) => right - left)
    .slice(0, 3)

  return (
    <div className="px-1 py-2">
      <svg
        aria-label="Gráfico general de progreso"
        className="h-auto w-full overflow-visible"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        {axisValues.map((value) => {
          const y = getChartY(value, minValue, maxValue)

          return (
            <line
              className={value === 100 ? "text-border" : "text-border/70"}
              key={`grid-${value}`}
              stroke="currentColor"
              strokeDasharray="4 4"
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={y}
              y2={y}
            />
          )
        })}
        {visibleSeries.map((item) => {
          const polylinePoints = item.points
            .map((point) => `${point.x},${point.y}`)
            .join(" ")
          const isMuted = item.isMuted

          return (
            <g key={item.movement.id}>
              <polyline
                fill="none"
                points={polylinePoints}
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={isMuted ? 0.2 : 1}
                strokeWidth={isMuted ? 2 : 3}
              />
              {item.points.map((point) => {
                const isActive = point.id === activePointId

                return (
                  <circle
                    aria-label={`${item.movement.name} ${formatChartDateLabel(
                      point.performedAt
                    )}`}
                    className="cursor-pointer transition"
                    cx={point.x}
                    cy={point.y}
                    fill={isActive ? item.color : "var(--card)"}
                    key={point.id}
                    onClick={() => onSelectPoint(point.id)}
                    r={isActive ? 5.5 : 4}
                    stroke={item.color}
                    strokeOpacity={isMuted ? 0.25 : 1}
                    strokeWidth="3"
                  />
                )
              })}
            </g>
          )
        })}
        {axisValues.map((value) => (
          <text
            className="fill-muted-foreground text-[10px] font-bold"
            dominantBaseline="middle"
            key={`label-${value}`}
            textAnchor="end"
            x={CHART_PADDING.left - 8}
            y={getChartY(value, minValue, maxValue)}
          >
            {formatNormalizedDelta(value)}
          </text>
        ))}
        {axisDates.map((axisDate) => (
          <text
            className="fill-muted-foreground text-[10px] font-bold"
            key={axisDate.timestamp}
            textAnchor={axisDate.textAnchor}
            x={axisDate.x}
            y={CHART_HEIGHT - 8}
          >
            {formatChartDateLabel(new Date(axisDate.timestamp).toISOString())}
          </text>
        ))}
      </svg>
    </div>
  )
}

export function ProgressOverviewPage({ movements }: ProgressOverviewPageData) {
  const [selectedRange, setSelectedRange] =
    useState<ExerciseProgressRangeKey>("6m")
  const [selectedMetricMode, setSelectedMetricMode] =
    useState<ProgressOverviewMetricMode>("best")
  const [selectedRoutineId, setSelectedRoutineId] = useState(ALL_ROUTINES_KEY)
  const [activeMovementIds, setActiveMovementIds] = useState<string[]>(
    movements.map((movement) => movement.id)
  )
  const [highlightedMovementId, setHighlightedMovementId] = useState<
    string | null
  >(null)
  const [activePointId, setActivePointId] = useState<string | null>(null)
  const routineOptions = useMemo(() => {
    const routinesById = new Map<string, string>()

    for (const movement of movements) {
      for (const session of movement.sessions) {
        routinesById.set(session.routineId, session.routineName)
      }
    }

    return [...routinesById.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, "es-UY"))
  }, [movements])
  const scopedMovements = useMemo(() => {
    if (selectedRoutineId === ALL_ROUTINES_KEY) {
      return movements
    }

    return movements
      .map((movement) => ({
        ...movement,
        sessions: movement.sessions.filter(
          (session) => session.routineId === selectedRoutineId
        ),
      }))
      .filter((movement) => movement.sessions.length > 0)
  }, [movements, selectedRoutineId])
  const series = useMemo(
    () =>
      buildOverviewSeries({
        activeMovementIds,
        highlightedMovementId,
        metricMode: selectedMetricMode,
        movements: scopedMovements,
        selectedRange,
      }),
    [
      activeMovementIds,
      highlightedMovementId,
      scopedMovements,
      selectedMetricMode,
      selectedRange,
    ]
  )
  const activePoint = series
    .flatMap((item) =>
      item.points.map((point) => ({
        ...point,
        movement: item.movement,
      }))
    )
    .find((point) => point.id === activePointId)
  const activeMovementIdSet = new Set(activeMovementIds)

  function selectRoutine(routineId: string) {
    const nextMovements =
      routineId === ALL_ROUTINES_KEY
        ? movements
        : movements
            .map((movement) => ({
              ...movement,
              sessions: movement.sessions.filter(
                (session) => session.routineId === routineId
              ),
            }))
            .filter((movement) => movement.sessions.length > 0)

    setSelectedRoutineId(routineId)
    setActiveMovementIds(nextMovements.map((movement) => movement.id))
    setHighlightedMovementId(null)
    setActivePointId(null)
  }

  function toggleMovement(movementId: string) {
    setActiveMovementIds((currentMovementIds) => {
      if (currentMovementIds.includes(movementId)) {
        return currentMovementIds.filter((id) => id !== movementId)
      }

      return [...currentMovementIds, movementId]
    })
  }

  function selectAllMovements() {
    setActiveMovementIds(scopedMovements.map((movement) => movement.id))
  }

  function clearMovements() {
    setActiveMovementIds([])
    setHighlightedMovementId(null)
    setActivePointId(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          asChild
          className="rounded-md border-2 border-border bg-card shadow-brutal"
          variant="outline"
        >
          <Link href="/">
            <ChevronLeft />
            Volver
          </Link>
        </Button>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-xl">Progreso</CardTitle>
          <CardDescription>
            Compará cambios porcentuales por período.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Rutina
            </div>
            <ProgressSegmentedControl
              onChange={selectRoutine}
              options={[
                {
                  value: ALL_ROUTINES_KEY,
                  label: "Todas",
                },
                ...routineOptions.map((routine) => ({
                  value: routine.id,
                  label: routine.name,
                })),
              ]}
              value={selectedRoutineId}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Rango
              </div>
              <ProgressSegmentedControl
                onChange={setSelectedRange}
                options={RANGE_OPTIONS.map((range) => ({
                  value: range,
                  label: getRangeLabel(range),
                }))}
                value={selectedRange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Métrica
              </div>
              <ProgressSegmentedControl
                onChange={setSelectedMetricMode}
                options={METRIC_OPTIONS}
                value={selectedMetricMode}
              />
            </div>
          </div>

          {selectedMetricMode === "volume" ? (
            <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              En ejercicios con peso, el volumen se estima con las repeticiones
              objetivo configuradas.
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Ejercicios
            </div>
            <div className="flex flex-wrap gap-2 rounded-lg border-2 border-border bg-card p-2 md:max-h-44 md:overflow-auto">
              <button
                className="rounded-md border-2 border-border bg-card px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:bg-muted"
                onClick={selectAllMovements}
                type="button"
              >
                Todos
              </button>
              <button
                className="rounded-md border-2 border-border bg-card px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:bg-muted"
                onClick={clearMovements}
                type="button"
              >
                Ninguno
              </button>
              {scopedMovements.map((movement) => {
                const isActive = activeMovementIdSet.has(movement.id)

                return (
                  <button
                    className={cn(
                      "rounded-md border-2 px-2.5 py-1.5 text-sm font-bold transition",
                      isActive
                        ? "border-border bg-accent text-accent-foreground shadow-brutal-sm"
                        : "border-border bg-muted text-muted-foreground hover:bg-card"
                    )}
                    key={movement.id}
                    onClick={() => toggleMovement(movement.id)}
                    type="button"
                  >
                    {movement.name}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {movements.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-6 text-center">
              <BarChart3 className="mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm font-bold text-foreground">
                Todavía no hay ejercicios con registros.
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Guardá sesiones para comparar el progreso general.
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-xl">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg">Variación de progreso</CardTitle>
              <CardDescription>
                Cambio contra el primer registro visible.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              <ProgressOverviewChart
                activePointId={activePointId}
                onSelectPoint={setActivePointId}
                series={series}
              />

              {activePoint ? (
                <div className="rounded-lg border-2 border-border bg-muted/40 px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {activePoint.movement.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatChartDateLabel(activePoint.performedAt)} ·{" "}
                        {activePoint.routineName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        {formatProgressOverviewMetricValue(
                          activePoint.movement,
                          selectedMetricMode,
                          activePoint.rawValue
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNormalizedDelta(activePoint.normalizedValue)} vs.
                        inicio
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg">Leyenda / resumen</CardTitle>
              <CardDescription>
                Tocá un ejercicio para resaltar su línea.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-4">
              {scopedMovements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-4 text-sm text-muted-foreground">
                  No hay ejercicios con registros para esta rutina.
                </div>
              ) : activeMovementIds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-4 text-sm text-muted-foreground">
                  Seleccioná al menos un ejercicio para ver el progreso.
                </div>
              ) : (
                series
                  .filter(
                    (item) =>
                      activeMovementIdSet.has(item.movement.id) &&
                      item.visibleSessionCount > 0
                  )
                  .map((item) => {
                  const isHighlighted =
                    highlightedMovementId === item.movement.id

                  return (
                    <button
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card px-3 py-2 text-left transition hover:bg-muted/50",
                        isHighlighted
                          ? "bg-muted shadow-brutal-sm"
                          : highlightedMovementId
                            ? "opacity-45"
                            : "opacity-100"
                      )}
                      key={item.movement.id}
                      onClick={() =>
                        setHighlightedMovementId(
                          isHighlighted ? null : item.movement.id
                        )
                      }
                      type="button"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="inline-block size-3 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-foreground">
                            {item.movement.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {item.visibleSessionCount === 1
                              ? "1 sesión visible"
                              : `${item.visibleSessionCount} sesiones visibles`}
                          </span>
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">
                          {formatProgressChangePercent(item.percentChange)}
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {formatProgressOverviewMetricValue(
                            item.movement,
                            selectedMetricMode,
                            item.lastValue
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
