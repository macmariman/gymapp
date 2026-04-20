import "server-only"

import { createHash } from "node:crypto"

import { prisma } from "@/lib/prisma"
import { getProgressOverviewPageData } from "@/lib/workouts/queries"
import type { ProgressOverviewSession } from "@/lib/workouts/types"

const WINDOW_DAYS = 90

export type InsightContext = {
  generatedAt: string
  windowDays: number
  windowStart: string
  totalSessions: number
  sessionsPerWeek: { avg: number; trend: "up" | "down" | "stable" }
  attendanceByWeek: Array<{ week: string; sessions: number }>
  routines: Array<{ name: string; sessionsCount: number }>
  movements: Array<{
    name: string
    logType: string
    routines: string[]
    sessionsLogged: number
    firstSession: SessionSnapshot
    lastSession: SessionSnapshot
    bestLiftSlopePerWeek: number
    volumeSlopePctPerMonth: number
    lastThreeSessionsFlat: boolean
  }>
  recentNotes: Array<{ date: string; routine: string; text: string }>
}

type SessionSnapshot = {
  date: string
  bestValue: number
  volumeValue: number
}

export type BuildContextResult = {
  context: InsightContext
  cacheKey: string
  sessionsInWindow: number
}

export async function buildInsightContext(
  now = new Date()
): Promise<BuildContextResult> {
  const windowStartDate = new Date(now)
  windowStartDate.setDate(windowStartDate.getDate() - WINDOW_DAYS)

  const [{ movements }, sessionsInRange, previousWindowSessions] =
    await Promise.all([
      getProgressOverviewPageData(),
      prisma.workoutSession.findMany({
        where: { performedAt: { gte: windowStartDate } },
        orderBy: { performedAt: "asc" },
        select: {
          id: true,
          performedAt: true,
          updatedAt: true,
          note: true,
          routine: { select: { name: true } },
        },
      }),
      prisma.workoutSession.count({
        where: {
          performedAt: {
            gte: new Date(
              windowStartDate.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000
            ),
            lt: windowStartDate,
          },
        },
      }),
    ])

  const totalSessions = sessionsInRange.length
  const weeks = WINDOW_DAYS / 7
  const avgPerWeek = Number((totalSessions / weeks).toFixed(1))
  const prevAvgPerWeek = previousWindowSessions / weeks
  const trend: "up" | "down" | "stable" =
    avgPerWeek - prevAvgPerWeek > 0.3
      ? "up"
      : avgPerWeek - prevAvgPerWeek < -0.3
        ? "down"
        : "stable"

  const attendanceByWeek = buildAttendanceByWeek(
    sessionsInRange.map((s) => s.performedAt),
    windowStartDate,
    now
  )

  const routineCounts = new Map<string, number>()
  for (const session of sessionsInRange) {
    const name = session.routine.name
    routineCounts.set(name, (routineCounts.get(name) ?? 0) + 1)
  }

  const movementsCtx = movements
    .map((movement) => {
      const sessions = movement.sessions
        .filter((s) => new Date(s.performedAt) >= windowStartDate)
        .sort(
          (a, b) =>
            new Date(a.performedAt).getTime() -
            new Date(b.performedAt).getTime()
        )

      if (sessions.length < 2) return null

      const routines = Array.from(
        new Set(sessions.map((s) => s.routineName))
      )
      const first = sessions[0]
      const last = sessions[sessions.length - 1]

      return {
        name: movement.name,
        logType: movement.logType,
        routines,
        sessionsLogged: sessions.length,
        firstSession: snapshot(first),
        lastSession: snapshot(last),
        bestLiftSlopePerWeek: slopePerWeek(sessions, (s) => s.bestValue ?? 0),
        volumeSlopePctPerMonth: slopePctPerMonth(
          sessions,
          (s) => s.volumeValue ?? 0
        ),
        lastThreeSessionsFlat: isFlat(
          sessions.slice(-3).map((s) => s.bestValue ?? 0)
        ),
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  const recentNotes = sessionsInRange
    .filter((s) => s.note && s.note.trim().length > 0)
    .slice(-15)
    .map((s) => ({
      date: s.performedAt.toISOString().slice(0, 10),
      routine: s.routine.name,
      text: s.note ?? "",
    }))

  const context: InsightContext = {
    generatedAt: now.toISOString().slice(0, 10),
    windowDays: WINDOW_DAYS,
    windowStart: windowStartDate.toISOString().slice(0, 10),
    totalSessions,
    sessionsPerWeek: { avg: avgPerWeek, trend },
    attendanceByWeek,
    routines: [...routineCounts.entries()]
      .map(([name, sessionsCount]) => ({ name, sessionsCount }))
      .sort((a, b) => b.sessionsCount - a.sessionsCount),
    movements: movementsCtx,
    recentNotes,
  }

  const lastSessionId =
    sessionsInRange[sessionsInRange.length - 1]?.id ?? "none"
  const lastUpdatedAt = sessionsInRange.reduce(
    (max, s) => (s.updatedAt > max ? s.updatedAt : max),
    new Date(0)
  )
  const cacheKey = createHash("sha1")
    .update(`${lastSessionId}:${totalSessions}:${lastUpdatedAt.toISOString()}`)
    .digest("hex")
    .slice(0, 16)

  return { context, cacheKey, sessionsInWindow: totalSessions }
}

function snapshot(session: ProgressOverviewSession): SessionSnapshot {
  return {
    date: session.performedAt.slice(0, 10),
    bestValue: session.bestValue ?? 0,
    volumeValue: session.volumeValue ?? 0,
  }
}

function slopePerWeek(
  sessions: ProgressOverviewSession[],
  getY: (s: ProgressOverviewSession) => number
): number {
  if (sessions.length < 2) return 0
  const baseTime = new Date(sessions[0].performedAt).getTime()
  const points = sessions.map((s) => ({
    x: (new Date(s.performedAt).getTime() - baseTime) / (7 * 24 * 60 * 60 * 1000),
    y: getY(s),
  }))
  return round(linearSlope(points), 2)
}

function slopePctPerMonth(
  sessions: ProgressOverviewSession[],
  getY: (s: ProgressOverviewSession) => number
): number {
  if (sessions.length < 2) return 0
  const first = getY(sessions[0])
  if (first === 0) return 0
  const baseTime = new Date(sessions[0].performedAt).getTime()
  const points = sessions.map((s) => ({
    x:
      (new Date(s.performedAt).getTime() - baseTime) /
      (30 * 24 * 60 * 60 * 1000),
    y: (getY(s) / first) * 100,
  }))
  return round(linearSlope(points), 1)
}

function linearSlope(points: Array<{ x: number; y: number }>): number {
  const n = points.length
  const sumX = points.reduce((acc, p) => acc + p.x, 0)
  const sumY = points.reduce((acc, p) => acc + p.y, 0)
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0)
  const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0)
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return 0
  return (n * sumXY - sumX * sumY) / denom
}

function isFlat(values: number[]): boolean {
  if (values.length < 3) return false
  const max = Math.max(...values)
  const min = Math.min(...values)
  if (max === 0) return true
  return (max - min) / max < 0.02
}

function buildAttendanceByWeek(
  dates: Date[],
  windowStart: Date,
  now: Date
): Array<{ week: string; sessions: number }> {
  const counts = new Map<string, number>()
  const cursor = new Date(windowStart)
  while (cursor <= now) {
    const key = isoWeekKey(cursor)
    if (!counts.has(key)) counts.set(key, 0)
    cursor.setDate(cursor.getDate() + 7)
  }
  for (const d of dates) {
    const key = isoWeekKey(d)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, sessions]) => ({ week, sessions }))
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
