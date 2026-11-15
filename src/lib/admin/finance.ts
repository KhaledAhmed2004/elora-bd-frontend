/** Report periods → Bangladesh calendar days for the API's ?from=&to= */
export type PeriodKey = "this-month" | "last-month" | "last-30" | "all"

export const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-30", label: "Last 30 days" },
  { value: "all", label: "All time" },
]

/** "YYYY-MM-DD" of a date in Bangladesh time (UTC+6) */
export const bdDay = (d: Date) =>
  new Date(d.getTime() + 6 * 3_600_000).toISOString().slice(0, 10)

export function periodDays(
  key: PeriodKey,
  now = new Date()
): { from?: string; to?: string } {
  const today = bdDay(now)
  const [y, m] = today.split("-").map(Number)
  const first = (yy: number, mm: number) =>
    `${yy + Math.floor((mm - 1) / 12)}-${String(((mm - 1 + 12) % 12) + 1).padStart(2, "0")}-01`
  switch (key) {
    case "this-month":
      return { from: first(y, m), to: today }
    case "last-month": {
      const start = first(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1)
      const end = bdDay(
        new Date(new Date(`${first(y, m)}T00:00:00Z`).getTime() - 86_400_000)
      )
      return { from: start, to: end }
    }
    case "last-30":
      return { from: bdDay(new Date(now.getTime() - 29 * 86_400_000)), to: today }
    default:
      return {}
  }
}

/** Download rows as a CSV file (opens fine in Excel; UTF-8 BOM for Bangla) */
export function downloadCsv(
  filename: string,
  header: string[],
  rows: (string | number)[][]
) {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
