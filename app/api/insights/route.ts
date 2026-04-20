import { NextResponse } from "next/server"

import { buildInsightContext } from "@/lib/insights/build-context"
import { generateInsight } from "@/lib/insights/gemini"

const MIN_SESSIONS = 5
const COOLDOWN_MS = 60_000

export const dynamic = "force-dynamic"

let lastGeneratedAt = 0

export async function GET(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return new NextResponse(null, { status: 503 })
  }

  const { context, cacheKey, sessionsInWindow } = await buildInsightContext()

  if (sessionsInWindow < MIN_SESSIONS) {
    return NextResponse.json({
      status: "insufficient_data",
      sessionsInWindow,
      minSessions: MIN_SESSIONS,
      cacheKey,
    })
  }

  const ifNoneMatch = request.headers.get("if-none-match")
  if (ifNoneMatch && ifNoneMatch === cacheKey) {
    return new NextResponse(null, { status: 304 })
  }

  const now = Date.now()
  if (now - lastGeneratedAt < COOLDOWN_MS) {
    return NextResponse.json(
      {
        status: "cooldown",
        retryAfterMs: COOLDOWN_MS - (now - lastGeneratedAt),
      },
      { status: 429 }
    )
  }
  lastGeneratedAt = now

  const insight = await generateInsight(context)

  return NextResponse.json({
    status: "ok",
    insight,
    cacheKey,
    generatedAt: new Date().toISOString(),
  })
}
