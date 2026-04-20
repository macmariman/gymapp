import { NextResponse } from "next/server"

import {
  buildInsightContext,
  getInsightCacheKey,
} from "@/lib/insights/build-context"
import { generateInsight } from "@/lib/insights/gemini"

const MIN_SESSIONS = 5

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return new NextResponse(null, { status: 503 })
  }

  const cacheKey = await getInsightCacheKey()
  if (request.headers.get("if-none-match") === cacheKey) {
    return new NextResponse(null, { status: 304 })
  }

  const { context, sessionsInWindow } = await buildInsightContext()

  if (sessionsInWindow < MIN_SESSIONS) {
    return NextResponse.json({
      status: "insufficient_data",
      sessionsInWindow,
      minSessions: MIN_SESSIONS,
      cacheKey,
    })
  }

  let insight
  try {
    insight = await generateInsight(context)
  } catch (err) {
    const isUnavailable =
      (err instanceof Error && err.name === "AbortError") ||
      (err instanceof Error && err.message.includes("503"))
    return NextResponse.json(
      { status: isUnavailable ? "unavailable" : "error" },
      { status: 502 }
    )
  }

  return NextResponse.json({
    status: "ok",
    insight,
    cacheKey,
    generatedAt: new Date().toISOString(),
  })
}
