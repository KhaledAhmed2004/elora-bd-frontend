import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types"

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

/** White card with an optional title row — the basic block of every admin page */
export function Panel({
  title,
  description,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col admin-card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{title}</h2>
              {description && (
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  )
}

/** Signed change against a named period. `goodWhenUp` flips the colours. */
export function Delta({
  value,
  goodWhenUp = true,
  className,
}: {
  /** Fraction, e.g. 0.12 = +12%. null = nothing to compare with */
  value: number | null
  goodWhenUp?: boolean
  className?: string
}) {
  if (value === null || !Number.isFinite(value)) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>
  }
  const pct = Math.round(Math.abs(value) * 100)
  if (pct === 0) {
    return <span className={cn("text-xs text-muted-foreground", className)}>0%</span>
  }
  const up = value > 0
  const good = up === goodWhenUp
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
        good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : "−"}
      {pct}%
    </span>
  )
}

/** Tiny trend line for stat tiles. Decorative: the number beside it is the data. */
export function Sparkline({
  values,
  className,
}: {
  values: number[]
  className?: string
}) {
  if (values.length < 2) return null
  const w = 96
  const h = 32
  const pad = 3
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / span) * (h - pad * 2)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-8 w-24 shrink-0", className)}
      aria-hidden
    >
      <path
        d={`${line.join(" ")} L${lx.toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`}
        fill="var(--chart-1)"
        opacity={0.08}
      />
      <path
        d={line.join(" ")}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.55}
      />
      <circle
        cx={lx}
        cy={ly}
        r={2.5}
        fill="var(--chart-1)"
        stroke="var(--card)"
        strokeWidth={1.5}
      />
    </svg>
  )
}

/** KPI tile: label, big value, change vs a named period, optional sparkline */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  goodWhenUp,
  hint,
  trend,
  href,
}: {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  delta?: number | null
  deltaLabel?: string
  goodWhenUp?: boolean
  hint?: React.ReactNode
  trend?: number[]
  href?: string
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {trend && <Sparkline values={trend} className="hidden sm:block" />}
      </div>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {delta !== undefined && <Delta value={delta} goodWhenUp={goodWhenUp} />}
        {deltaLabel && <span>{deltaLabel}</span>}
        {hint}
      </div>
    </>
  )
  const cls = "admin-card block h-full p-4 md:p-5"
  return href ? (
    <Link
      href={href}
      className={cn(
        cls,
        "transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/**
 * Admin-facing status names and colours. The storefront keeps its own copy
 * (components/account/order-card) because its wording is for customers.
 */
export const ADMIN_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
}

export const ADMIN_STATUS_TONE: Record<OrderStatus, { pill: string; dot: string }> = {
  pending: { pill: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  confirmed: { pill: "bg-sky-50 text-sky-800 ring-sky-600/20", dot: "bg-sky-500" },
  processing: {
    pill: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
    dot: "bg-indigo-500",
  },
  shipped: {
    pill: "bg-violet-50 text-violet-800 ring-violet-600/20",
    dot: "bg-violet-500",
  },
  delivered: {
    pill: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  cancelled: { pill: "bg-red-50 text-red-800 ring-red-600/20", dot: "bg-red-500" },
  returned: { pill: "bg-zinc-100 text-zinc-700 ring-zinc-500/20", dot: "bg-zinc-400" },
}

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  const tone = ADMIN_STATUS_TONE[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        tone.pill,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden />
      {ADMIN_STATUS_LABEL[status]}
    </span>
  )
}

export const PAYMENT_LABEL = {
  cod: "COD",
  bkash: "bKash",
  nagad: "Nagad",
  sslcommerz: "Card",
} as const

/** Segmented filter tabs with optional counts (orders, reviews, activity…) */
export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  label = "Filter",
}: {
  tabs: readonly { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
  className?: string
  label?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "-mx-4 mb-4 scrollbar-none flex gap-1 overflow-x-auto border-b px-4 md:mx-0 md:px-0",
        className
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative -mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-4 flex gap-2">{children}</div>}
    </div>
  )
}

/** Error box with a retry button for failed admin queries */
export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 admin-card border-destructive/30 p-8 text-center text-sm">
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </span>
      <p className="font-medium">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/** Previous / next for lists paged by the API */
export function Pager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-3 flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">
        {total.toLocaleString("en-IN")} results · Page {page} of {totalPages}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
