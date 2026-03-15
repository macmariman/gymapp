"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  filterSessionsByRange,
  formatChartDateLabel,
  formatHistoryDateLabel,
  formatImprovementDate,
  formatProgressMetricValue,
  getLastImprovementSession,
  getLastMetricValue,
  getMetricValue,
  getRangeLabel,
  getRecordValue,
  getSessionsSinceImprovement,
  getTrendLabel,
} from "@/lib/workouts/progress"
import type {
  ExerciseProgressMetricKey,
  ExerciseProgressPageData,
  ExerciseProgressRangeKey,
  ExerciseProgressSession,
} from "@/lib/workouts/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const RANGE_OPTIONS: ExerciseProgressRangeKey[] = ["3m", "6m", "1y", "all"]
const CHART_WIDTH = 320
const CHART_HEIGHT = 180
const CHART_PADDING = {
  top: 20,
  right: 16,
  bottom: 28,
  left: 16,
}

function getTrendBadgeClassName(trendLabel: string) {
  if (trendLabel === "Subiendo") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (trendLabel === "Bajando") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (trendLabel === "Estable") {
    return "border-border bg-card text-foreground"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
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

function ProgressStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-border bg-muted/40 px-3 py-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-foreground">{value}</div>
    </div>
  )
}

function buildChartPoints(
  sessions: ExerciseProgressSession[],
  metricKey: ExerciseProgressMetricKey
) {
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const points = sessions
    .map((session) => {
      const value = getMetricValue(session, metricKey)

      if (value === null) {
        return null
      }

      return {
        id: session.id,
        label: formatChartDateLabel(session.performedAt),
        value,
        session,
      }
    })
    .filter((point): point is NonNullable<typeof point> => point !== null)

  if (points.length === 0) {
    return {
      chartPoints: [],
      maxValue: 0,
      minValue: 0,
      polylinePoints: "",
    }
  }

  const rawMinValue = Math.min(...points.map((point) => point.value))
  const rawMaxValue = Math.max(...points.map((point) => point.value))
  const valueSpread = rawMaxValue - rawMinValue
  const minValue = Math.max(
    0,
    valueSpread === 0 ? rawMinValue * 0.9 : rawMinValue - valueSpread * 0.15
  )
  const maxValue =
    valueSpread === 0
      ? rawMaxValue * 1.1 || rawMaxValue + 1
      : rawMaxValue + valueSpread * 0.15

  const chartPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? CHART_PADDING.left + innerWidth / 2
        : CHART_PADDING.left + (index / (points.length - 1)) * innerWidth
    const normalizedValue =
      maxValue === minValue
        ? 0.5
        : (point.value - minValue) / (maxValue - minValue)
    const y = CHART_PADDING.top + innerHeight - normalizedValue * innerHeight

    return {
      ...point,
      x,
      y,
    }
  })

  return {
    chartPoints,
    maxValue: rawMaxValue,
    minValue: rawMinValue,
    polylinePoints: chartPoints
      .map((point) => `${point.x},${point.y}`)
      .join(" "),
  }
}

function ProgressChart({
  sessions,
  metricKey,
  activeSessionId,
  onSelectSession,
}: {
  sessions: ExerciseProgressSession[]
  metricKey: ExerciseProgressMetricKey
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
}) {
  const { chartPoints, maxValue, minValue, polylinePoints } = buildChartPoints(
    sessions,
    metricKey
  )

  if (chartPoints.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-8 text-center text-sm text-muted-foreground">
        No hay sesiones en el rango seleccionado.
      </div>
    )
  }

  const firstPoint = chartPoints[0]
  const middlePoint = chartPoints[Math.floor(chartPoints.length / 2)]
  const lastPoint = chartPoints[chartPoints.length - 1]
  const axisPoints = [firstPoint, middlePoint, lastPoint].filter(
    (point, index, array) =>
      array.findIndex((candidate) => candidate.id === point.id) === index
  )

  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-border bg-card px-3 py-3">
        <svg
          aria-label="Gráfico de progreso"
          className="h-auto w-full overflow-visible"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          <line
            stroke="currentColor"
            strokeDasharray="4 4"
            x1={CHART_PADDING.left}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y1={CHART_HEIGHT - CHART_PADDING.bottom}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
            className="text-border"
          />
          <line
            stroke="currentColor"
            strokeDasharray="4 4"
            x1={CHART_PADDING.left}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y1={CHART_PADDING.top}
            y2={CHART_PADDING.top}
            className="text-border/70"
          />
          <polyline
            className="fill-none text-accent"
            points={polylinePoints}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {chartPoints.map((point) => {
            const isActive = point.id === activeSessionId

            return (
              <g key={point.id}>
                <circle
                  className={cn(
                    "cursor-pointer transition",
                    isActive
                      ? "fill-accent stroke-card"
                      : "fill-card stroke-accent"
                  )}
                  cx={point.x}
                  cy={point.y}
                  onClick={() => onSelectSession(point.id)}
                  r={isActive ? 5.5 : 4}
                  strokeWidth="3"
                />
              </g>
            )
          })}
          <text
            className="fill-muted-foreground text-[10px] font-bold"
            textAnchor="start"
            x={CHART_PADDING.left}
            y={CHART_PADDING.top - 6}
          >
            {formatProgressMetricValue(metricKey, maxValue)}
          </text>
          <text
            className="fill-muted-foreground text-[10px] font-bold"
            textAnchor="start"
            x={CHART_PADDING.left}
            y={CHART_HEIGHT - 6}
          >
            {formatProgressMetricValue(metricKey, minValue)}
          </text>
          {axisPoints.map((point) => (
            <text
              key={point.id}
              className="fill-muted-foreground text-[10px] font-bold"
              textAnchor="middle"
              x={point.x}
              y={CHART_HEIGHT - 8}
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export function ExerciseProgressPage({
  backHref,
  movement,
  availableMetrics,
  sessions,
}: ExerciseProgressPageData & { backHref: string }) {
  const hasSessions = sessions.length > 0
  const hasEnoughHistory = sessions.length >= 6
  const [selectedMetric, setSelectedMetric] =
    useState<ExerciseProgressMetricKey>(availableMetrics[0].key)
  const [selectedRange, setSelectedRange] =
    useState<ExerciseProgressRangeKey>("all")
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    sessions[sessions.length - 1]?.id ?? null
  )

  const filteredSessions = filterSessionsByRange(sessions, selectedRange)
  const chartSessions = filteredSessions.filter(
    (session) => getMetricValue(session, selectedMetric) !== null
  )
  const activeSession =
    chartSessions.find((session) => session.id === activeSessionId) ??
    chartSessions[chartSessions.length - 1] ??
    null
  const recordValue = getRecordValue(sessions, selectedMetric)
  const lastImprovementSession = getLastImprovementSession(
    sessions,
    selectedMetric
  )
  const sessionsSinceImprovement = getSessionsSinceImprovement(
    sessions,
    selectedMetric
  )
  const lastMetricValue = getLastMetricValue(sessions, selectedMetric)
  const trendLabel = getTrendLabel(sessions, selectedMetric)
  const historySessions = [...filteredSessions].reverse()

  useEffect(() => {
    if (!chartSessions.some((session) => session.id === activeSessionId)) {
      setActiveSessionId(chartSessions[chartSessions.length - 1]?.id ?? null)
    }
  }, [activeSessionId, chartSessions])

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          asChild
          className="rounded-md border-2 border-border bg-card shadow-brutal"
          variant="outline"
        >
          <Link href={backHref}>
            <ChevronLeft className="size-4" />
            Volver
          </Link>
        </Button>
        {hasEnoughHistory ? (
          <Badge
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide",
              getTrendBadgeClassName(trendLabel)
            )}
            variant="outline"
          >
            {trendLabel}
          </Badge>
        ) : null}
      </div>

      <Card className="rounded-xl">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-xl">{movement.name}</CardTitle>
          <CardDescription>{movement.detail}</CardDescription>
          <div className="mt-3 text-sm text-muted-foreground">
            {sessions.length === 1 ? "1 sesión" : `${sessions.length} sesiones`}{" "}
            · Última:{" "}
            {sessions.length > 0
              ? formatHistoryDateLabel(
                  sessions[sessions.length - 1].performedAt
                )
              : "Sin sesiones"}
          </div>
        </CardHeader>
        {hasSessions ? (
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Métrica
              </div>
              <ProgressSegmentedControl
                onChange={setSelectedMetric}
                options={availableMetrics.map((metric) => ({
                  value: metric.key,
                  label: metric.label,
                }))}
                value={selectedMetric}
              />
            </div>

            <div className="space-y-2">
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

            {movement.logType === "weight" &&
            selectedMetric === "totalVolume" ? (
              <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                El volumen se estima con las repeticiones objetivo configuradas
                en el ejercicio.
              </div>
            ) : null}
          </CardContent>
        ) : (
          <CardContent className="pt-4">
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-6 text-center">
              <div className="text-sm font-bold text-foreground">
                Aún no hay suficientes datos para este ejercicio.
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Guardá más sesiones para ver la evolución de su progreso.
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {hasSessions ? (
        <>
          <Card className="rounded-xl">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg">Gráfico histórico</CardTitle>
              <CardDescription>
                Una sesión es un punto dentro del rango seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <ProgressChart
                activeSessionId={activeSession?.id ?? null}
                metricKey={selectedMetric}
                onSelectSession={setActiveSessionId}
                sessions={chartSessions}
              />

              {activeSession ? (
                <div className="rounded-lg border-2 border-border bg-muted/40 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {formatHistoryDateLabel(activeSession.performedAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeSession.routineName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        {formatProgressMetricValue(
                          selectedMetric,
                          getMetricValue(activeSession, selectedMetric)
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {
                          availableMetrics.find(
                            (metric) => metric.key === selectedMetric
                          )?.label
                        }
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {activeSession.setSummary}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg">Resumen</CardTitle>
              <CardDescription>
                {hasEnoughHistory
                  ? "Indicadores históricos para la métrica seleccionada."
                  : "Cuando llegues a 6 sesiones verás la tendencia de este ejercicio."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-4">
              <ProgressStatCard
                label="Último valor"
                value={formatProgressMetricValue(
                  selectedMetric,
                  lastMetricValue
                )}
              />
              <ProgressStatCard
                label="Récord"
                value={formatProgressMetricValue(selectedMetric, recordValue)}
              />
              <ProgressStatCard
                label="Última mejora"
                value={formatImprovementDate(
                  lastImprovementSession?.performedAt ?? null
                )}
              />
              <ProgressStatCard
                label="Sin mejorar"
                value={
                  sessionsSinceImprovement === null
                    ? "Sin datos"
                    : sessionsSinceImprovement === 1
                      ? "1 sesión"
                      : `${sessionsSinceImprovement} sesiones`
                }
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg">Historial</CardTitle>
              <CardDescription>
                {historySessions.length === 0
                  ? "No hay sesiones en el rango seleccionado."
                  : `${historySessions.length} sesiones visibles`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {historySessions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-4 text-sm text-muted-foreground">
                  Todavía no hay sesiones para mostrar en este rango.
                </div>
              ) : (
                historySessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-lg border border-border bg-card px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {formatHistoryDateLabel(session.performedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.routineName}
                        </div>
                      </div>
                      <div className="text-right text-sm font-bold text-foreground">
                        {formatProgressMetricValue(
                          selectedMetric,
                          getMetricValue(session, selectedMetric)
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {session.setSummary}
                    </div>
                    {session.note ? (
                      <div className="mt-2 rounded-md bg-muted px-2 py-2 text-xs text-muted-foreground">
                        {session.note}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  )
}
