import { NextResponse } from "next/server"

import {
  buildInsightContext,
  getInsightCacheKey,
} from "@/lib/insights/build-context"
import { generateInsight } from "@/lib/insights/gemini"

const MIN_SESSIONS = 5
const COOLDOWN_MS = 60_000

export const dynamic = "force-dynamic"

let lastGeneratedAt = 0

export async function GET(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return new NextResponse(null, { status: 503 })
  }

  // Cheap check: only the last session ID determines freshness
  const cacheKey = await getInsightCacheKey()
  if (request.headers.get("if-none-match") === cacheKey) {
    return new NextResponse(null, { status: 304 })
  }

  // Cooldown before doing any expensive work
  const now = Date.now()
  if (now - lastGeneratedAt < COOLDOWN_MS) {
    return NextResponse.json(
      { status: "cooldown", retryAfterMs: COOLDOWN_MS - (now - lastGeneratedAt) },
      { status: 429 }
    )
  }

  // Full context build (only reached on cache miss + no cooldown)
  const { context, sessionsInWindow } = await buildInsightContext()

  if (sessionsInWindow < MIN_SESSIONS) {
    return NextResponse.json({
      status: "insufficient_data",
      sessionsInWindow,
      minSessions: MIN_SESSIONS,
      cacheKey,
    })
  }

  const insight = await generateInsight(context)
  lastGeneratedAt = now

  return NextResponse.json({
    status: "ok",
    insight,
    cacheKey,
    generatedAt: new Date().toISOString(),
  })
}
