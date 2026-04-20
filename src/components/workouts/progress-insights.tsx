"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowRight, Minus, RefreshCw, TrendingUp, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

type Bullet = {
  type: "progress" | "plateau" | "warning"
  text: string
}

type Insight = {
  headline: string
  bullets: Bullet[]
  suggestion: string
}

type Stored = {
  insight: Insight
  generatedAt: string
  cacheKey: string
}

type InsufficientData = {
  status: "insufficient_data"
  sessionsInWindow: number
  minSessions: number
  cacheKey: string
}

type OkResponse = {
  status: "ok"
  insight: Insight
  cacheKey: string
  generatedAt: string
}

type InsightResponse = OkResponse | InsufficientData

const STORAGE_KEY = "gymapp:progress-insight"

export function ProgressInsights() {
  const [stored, setStored] = useState<Stored | null>(null)
  const [phase, setPhase] = useState<
    "idle" | "loading" | "error" | "insufficient" | "disabled"
  >("loading")
  const [insufficientCount, setInsufficientCount] = useState<number | null>(null)

  const fetchInsight = useCallback(
    async (opts: { force?: boolean } = {}) => {
      if (opts.force) {
        setPhase("loading")
      }
      try {
        const headers: HeadersInit = {}
        if (!opts.force) {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Stored
              headers["If-None-Match"] = parsed.cacheKey
            } catch {
              localStorage.removeItem(STORAGE_KEY)
            }
          }
        }

        const res = await fetch("/api/insights", { headers })

        if (res.status === 503) {
          setPhase("disabled")
          return
        }

        if (res.status === 304 || res.status === 429) {
          setPhase("idle")
          return
        }

        if (!res.ok) {
          setPhase("error")
          return
        }

        const data = (await res.json()) as InsightResponse

        if (data.status === "insufficient_data") {
          setInsufficientCount(data.sessionsInWindow)
          setPhase("insufficient")
          localStorage.removeItem(STORAGE_KEY)
          return
        }

        const next: Stored = {
          insight: data.insight,
          generatedAt: data.generatedAt,
          cacheKey: data.cacheKey,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        setStored(next)
        setPhase("idle")
      } catch (error) {
        console.error("[progress-insights]", error)
        setPhase("error")
      }
    },
    []
  )

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Stored
        setStored(parsed)
        setPhase("idle")
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    void fetchInsight()
  }, [fetchInsight])

  if (phase === "disabled") return null

  if (phase === "insufficient") {
    return (
      <section className="rounded-lg border-2 border-border bg-muted/40 px-4 py-4">
        <Header />
        <p className="mt-3 text-sm text-muted-foreground">
          Necesitás al menos 5 sesiones en los últimos 90 días para generar
          insights. Llevás {insufficientCount ?? 0}.
        </p>
      </section>
    )
  }

  const isLoading = phase === "loading" && !stored
  const isRefreshing = phase === "loading" && !!stored

  return (
    <section className="rounded-lg border-2 border-border bg-muted/40 px-4 py-4">
      <Header />

      {isLoading ? (
        <InsightSkeleton />
      ) : stored ? (
        <div className={cn("mt-3", isRefreshing && "opacity-60")}>
          <h2 className="text-base font-bold leading-snug">
            {stored.insight.headline}
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {stored.insight.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <BulletIcon type={bullet.type} />
                <span className="flex-1">{bullet.text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-2.5 border-t-2 border-border pt-3">
            <ArrowRight
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground"
              strokeWidth={2.5}
            />
            <p className="flex-1 text-sm font-bold text-foreground">
              {stored.insight.suggestion}
            </p>
          </div>
        </div>
      ) : phase === "error" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No pudimos generar insights ahora.
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void fetchInsight({ force: true })}
          disabled={phase === "loading"}
          className="inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", phase === "loading" && "animate-spin")}
          />
          Regenerar
        </button>
        {stored && (
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {formatRelative(stored.generatedAt)}
          </span>
        )}
      </div>
    </section>
  )
}

function Header() {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      Insights · Últimos 90 días
    </div>
  )
}

function BulletIcon({ type }: { type: Bullet["type"] }) {
  const Icon = type === "progress" ? TrendingUp : type === "warning" ? TriangleAlert : Minus
  const colorClass =
    type === "progress"
      ? "text-chart-1"
      : type === "warning"
        ? "text-destructive"
        : "text-muted-foreground"

  return (
    <span
      className={cn(
        "mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-border bg-background",
        colorClass
      )}
      aria-hidden
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
    </span>
  )
}

function InsightSkeleton() {
  return (
    <div className="mt-3 space-y-2" aria-hidden>
      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
      <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
    </div>
  )
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMin = Math.round((now - then) / 60000)
  if (diffMin < 1) return "hace unos segundos"
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  const diffD = Math.round(diffH / 24)
  return `hace ${diffD} d`
}
