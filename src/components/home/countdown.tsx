"use client"

import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

/** Ticks once per second; `null` on the server so SSR and hydration match. */
function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000)
  return () => clearInterval(id)
}
const getNowSeconds = () => Math.floor(Date.now() / 1000)
const getServerNow = () => null

/** Next midnight in Bangladesh time (UTC+6) — a daily flash sale. */
function nextBdMidnight(nowSec: number) {
  const BD_OFFSET = 6 * 3600
  const day = 86400
  return Math.floor((nowSec + BD_OFFSET) / day) * day + day - BD_OFFSET
}

const pad = (n: number) => String(n).padStart(2, "0")

export function Countdown({
  endsAt,
  className,
}: {
  endsAt?: number
  className?: string
}) {
  const now = useSyncExternalStore(subscribe, getNowSeconds, getServerNow)
  const target = endsAt ?? (now ? nextBdMidnight(now) : 0)
  const left = now ? Math.max(0, target - now) : null

  // Multi-day campaigns get a "Days" box; the daily flash sale never does
  const withDays = left != null && left >= 86400
  const parts =
    left == null
      ? ["--", "--", "--"]
      : withDays
        ? [
            Math.floor(left / 86400),
            Math.floor((left % 86400) / 3600),
            Math.floor((left % 3600) / 60),
            left % 60,
          ].map(pad)
        : [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map(pad)
  const labels = withDays ? ["Days", "Hrs", "Min", "Sec"] : ["Hrs", "Min", "Sec"]

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="timer"
      aria-label="Time left until the offer ends"
    >
      {parts.map((value, i) => (
        <span key={labels[i]} className="flex items-center gap-1.5">
          <span className="flex min-w-9 flex-col items-center rounded-md bg-foreground px-1.5 py-1 text-background">
            <span className="text-base leading-none font-bold tabular-nums">{value}</span>
            <span className="mt-0.5 text-[9px] uppercase opacity-70">{labels[i]}</span>
          </span>
          {i < parts.length - 1 && <span className="font-bold">:</span>}
        </span>
      ))}
    </div>
  )
}
