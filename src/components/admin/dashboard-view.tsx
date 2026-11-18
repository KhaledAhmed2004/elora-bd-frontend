"use client"

import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  CircleCheck,
  type LucideIcon,
  MessageSquareText,
  PackageCheck,
  PhoneCall,
  PhoneMissed,
  ShoppingBag,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { adminQueries, type Dashboard, useAdminQuery } from "@/lib/admin/queries"
import { formatDate, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAdminAuthStore } from "@/store/admin-auth-store"
import type { OrderStatus } from "@/types"

import {
  ADMIN_STATUS_LABEL,
  ADMIN_STATUS_TONE,
  Delta,
  EmptyState,
  PageHeader,
  Panel,
  QueryError,
  StatCard,
  StatusBadge,
} from "./admin-ui"

type Metric = "revenue" | "orders"

const chartConfig = {
  revenue: { label: "Sales", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-1)" },
} satisfies ChartConfig

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#0ea5e9",
  processing: "#6366f1",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
  returned: "#a1a1aa",
}

const statusChartConfig = {
  orders: { label: "Orders" },
  pending: { label: ADMIN_STATUS_LABEL.pending, color: STATUS_COLORS.pending },
  confirmed: { label: ADMIN_STATUS_LABEL.confirmed, color: STATUS_COLORS.confirmed },
  processing: { label: ADMIN_STATUS_LABEL.processing, color: STATUS_COLORS.processing },
  shipped: { label: ADMIN_STATUS_LABEL.shipped, color: STATUS_COLORS.shipped },
  delivered: { label: ADMIN_STATUS_LABEL.delivered, color: STATUS_COLORS.delivered },
  cancelled: { label: ADMIN_STATUS_LABEL.cancelled, color: STATUS_COLORS.cancelled },
  returned: { label: ADMIN_STATUS_LABEL.returned, color: STATUS_COLORS.returned },
} satisfies ChartConfig

/** "2026-11-13" → "13 Nov" */
const shortDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0)
/** Change of `now` against `before` as a fraction; null when there is no base */
const change = (now: number, before: number) =>
  before > 0 ? (now - before) / before : null
const compact = (v: number) =>
  v >= 100_000
    ? `${+(v / 100_000).toFixed(1)}L`
    : v >= 1000
      ? `${+(v / 1000).toFixed(1)}k`
      : String(v)

export function DashboardView() {
  const admin = useAdminAuthStore((s) => s.admin)
  const [now] = useState(() => new Date())
  const {
    data: stats,
    error,
    refetch,
  } = useAdminQuery(["dashboard"], adminQueries.dashboard, {
    refetchInterval: 30_000,
  })
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />
  if (!stats) return <DashboardSkeleton />

  const revenue = stats.revenueSeries.map((p) => p.revenue)
  const orders = stats.revenueSeries.map((p) => p.orders)
  const yesterday = stats.revenueSeries.at(-2)
  const week = sum(revenue.slice(-7))
  const prevWeek = sum(revenue.slice(-14, -7))
  const hour = now.getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const canSeeReports = admin?.role === "OWNER" || admin?.role === "MANAGER"

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${admin?.name.split(" ")[0] ?? "there"}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-1.5">
            <CalendarDays className="size-3.5" />
            {now.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            <span aria-hidden>·</span>
            Sales this month{" "}
            <strong className="font-semibold text-foreground">
              {formatPrice(stats.monthRevenue)}
            </strong>
          </span>
        }
      >
        {canSeeReports && (
          <Button asChild variant="outline">
            <Link href="/admin/reports">
              <ChartColumn /> Reports
            </Link>
          </Button>
        )}
      </PageHeader>

      <ul className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <li>
          <StatCard
            label="Today's sales"
            value={formatPrice(stats.todayRevenue)}
            icon={Banknote}
            delta={change(stats.todayRevenue, yesterday?.revenue ?? 0)}
            deltaLabel="vs yesterday"
            trend={revenue}
          />
        </li>
        <li>
          <StatCard
            label="Today's orders"
            value={stats.todayOrders}
            icon={ShoppingBag}
            delta={change(stats.todayOrders, yesterday?.orders ?? 0)}
            deltaLabel="vs yesterday"
            trend={orders}
          />
        </li>
        <li>
          <StatCard
            label="Sales, last 7 days"
            value={formatPrice(week)}
            icon={PackageCheck}
            delta={change(week, prevWeek)}
            deltaLabel="vs previous 7 days"
          />
        </li>
        <li>
          <StatCard
            label="Customers"
            value={stats.customers.toLocaleString("en-IN")}
            icon={Users}
            hint="With at least one order"
            href="/admin/customers"
          />
        </li>
      </ul>

      <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-3">
        <div className="space-y-4 md:space-y-6 xl:col-span-2">
          <SalesChart stats={stats} />
          <RecentOrders stats={stats} />
        </div>
        <div className="space-y-4 md:space-y-6">
          <Todo stats={stats} />
          <StatusBreakdown stats={stats} />
          <LowStock stats={stats} />
        </div>
      </div>
    </div>
  )
}

function SalesChart({ stats }: { stats: Dashboard }) {
  const [metric, setMetric] = useState<Metric>("revenue")
  const [days, setDays] = useState<7 | 14>(14)
  const all = stats.revenueSeries
  const series = all.slice(-days).map((p) => ({ ...p, day: shortDay(p.date) }))
  const total = sum(series.map((p) => p[metric]))
  // Only the 7-day view has a full previous period inside the 14 days we load
  const previous = days === 7 ? sum(all.slice(0, 7).map((p) => p[metric])) : null
  const fmt = (v: number) => (metric === "revenue" ? formatPrice(v) : String(v))

  return (
    <Panel
      title="Sales overview"
      description={`${series[0]?.day} – ${series.at(-1)?.day}`}
      action={
        <div className="flex items-center gap-2">
          <Segmented
            label="Measure"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "revenue", label: "Sales" },
              { value: "orders", label: "Orders" },
            ]}
          />
          <Segmented
            label="Period"
            value={String(days) as "7" | "14"}
            onChange={(v) => setDays(v === "7" ? 7 : 14)}
            options={[
              { value: "7", label: "7 days" },
              { value: "14", label: "14 days" },
            ]}
          />
        </div>
      }
      bodyClassName="p-4 md:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-3xl font-semibold tracking-tight">{fmt(total)}</p>
        {previous !== null && (
          <>
            <Delta value={change(total, previous)} />
            <span className="text-xs text-muted-foreground">vs previous 7 days</span>
          </>
        )}
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
        <BarChart data={series} margin={{ left: 4, right: 12, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
            tickFormatter={(v: number) => (metric === "revenue" ? compact(v) : String(v))}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(_value, _name, item) => {
                  const p = item.payload as { revenue: number; orders: number }
                  return (
                    <span className="grid w-full gap-0.5">
                      <span className="flex justify-between gap-6">
                        <span className="text-muted-foreground">Sales</span>
                        <span className="font-medium tabular-nums">
                          {formatPrice(p.revenue)}
                        </span>
                      </span>
                      <span className="flex justify-between gap-6">
                        <span className="text-muted-foreground">Orders</span>
                        <span className="font-medium tabular-nums">{p.orders}</span>
                      </span>
                    </span>
                  )
                }}
              />
            }
          />
          <Bar
            dataKey={metric}
            fill={`var(--color-${metric})`}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ChartContainer>
    </Panel>
  )
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex rounded-lg bg-muted p-0.5 text-xs font-medium"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2 py-1 whitespace-nowrap transition-colors",
            o.value === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** The work queue: what someone has to act on right now */
function Todo({ stats }: { stats: Dashboard }) {
  const outOfStock = stats.lowStock.filter((p) => p.stock === 0).length
  const all: { icon: LucideIcon; count: number; label: string; href: string }[] = [
    {
      icon: PhoneCall,
      count: stats.pending,
      label: "Orders to confirm by phone",
      href: "/admin/orders?status=pending",
    },
    {
      icon: PackageCheck,
      count: stats.statusBreakdown.confirmed ?? 0,
      label: "Confirmed orders to pack",
      href: "/admin/orders?status=confirmed",
    },
    {
      icon: PhoneMissed,
      count: stats.incompleteOrders,
      label: "Incomplete checkouts to follow up",
      href: "/admin/incomplete",
    },
    {
      icon: MessageSquareText,
      count: stats.pendingReviews,
      label: "Reviews to approve",
      href: "/admin/reviews",
    },
    {
      icon: AlertTriangle,
      count: outOfStock,
      label: "Products out of stock",
      href: "/admin/products",
    },
  ]
  const items = all.filter((i) => i.count > 0)

  return (
    <Panel title="To do" description="Things waiting for you">
      {items.length ? (
        <ul className="divide-y">
          {items.map(({ icon: Icon, count, label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/60 md:px-5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1">{label}</span>
                <span className="font-semibold tabular-nums">{count}</span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={CircleCheck}
          title="All caught up"
          description="No orders, reviews or stock need your attention."
        />
      )}
    </Panel>
  )
}

function StatusBreakdown({ stats }: { stats: Dashboard }) {
  const router = useRouter()
  const total = sum(Object.values(stats.statusBreakdown).map((n) => n ?? 0))

  const chartData = useMemo(() => {
    if (total === 0) {
      return [{ status: "empty" as const, orders: 1, fill: "var(--muted)" }]
    }
    const active = STATUS_ORDER.filter((s) => (stats.statusBreakdown[s] ?? 0) > 0)
    return active.map((s) => ({
      status: s,
      orders: stats.statusBreakdown[s] ?? 0,
      fill: STATUS_COLORS[s],
    }))
  }, [stats.statusBreakdown, total])

  return (
    <Panel
      title="Orders by status"
      description={`${total.toLocaleString("en-IN")} orders in total`}
      bodyClassName="p-3"
    >
      <div className="flex flex-col items-center">
        <ChartContainer
          config={statusChartConfig}
          className="mx-auto aspect-square max-h-[210px] w-full"
        >
          <PieChart>
            {total > 0 && (
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    className="w-40"
                    formatter={(value, name, item) => {
                      const statusKey = (item.payload?.status as OrderStatus) || name
                      const label = ADMIN_STATUS_LABEL[statusKey] ?? statusKey
                      const pct = total
                        ? Math.round(((value as number) / total) * 100)
                        : 0
                      return (
                        <div className="flex w-full items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: item.payload?.fill }}
                            />
                            {label}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {value}{" "}
                            <span className="font-normal text-muted-foreground">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
            )}
            <Pie
              data={chartData}
              dataKey="orders"
              nameKey="status"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              stroke="var(--background)"
              strokeWidth={3}
              className="cursor-pointer outline-none"
              onClick={(entry) => {
                const payload = entry?.payload as { status?: OrderStatus } | undefined
                const s = payload?.status ?? (entry?.name as OrderStatus | undefined)
                if (s && (s as string) !== "empty") {
                  router.push(`/admin/orders?status=${s}`)
                }
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold tracking-tight"
                        >
                          {total.toLocaleString("en-IN")}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs font-medium"
                        >
                          {total === 1 ? "Order" : "Orders"}
                        </tspan>
                      </text>
                    )
                  }
                  return null
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="mt-3 w-full divide-y divide-border/40 text-xs">
          {STATUS_ORDER.map((s) => {
            const n = stats.statusBreakdown[s] ?? 0
            const pct = total ? (n / total) * 100 : 0
            return (
              <li key={s}>
                <Link
                  href={`/admin/orders?status=${s}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn("size-2 rounded-full", ADMIN_STATUS_TONE[s].dot)}
                      aria-hidden
                    />
                    <span className="font-medium text-foreground">
                      {ADMIN_STATUS_LABEL[s]}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    <span
                      className={cn(
                        "font-semibold",
                        n > 0 ? "text-foreground" : "text-muted-foreground/60"
                      )}
                    >
                      {n}
                    </span>{" "}
                    <span className="text-muted-foreground">({Math.round(pct)}%)</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </Panel>
  )
}

function RecentOrders({ stats }: { stats: Dashboard }) {
  return (
    <Panel
      title="Recent orders"
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            View all <ChevronRight />
          </Link>
        </Button>
      }
    >
      {stats.recentOrders.length ? (
        <ul className="divide-y">
          {stats.recentOrders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/60 md:px-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground uppercase">
                  {o.shipName.trim().charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{o.shipName}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.orderNumber} · {formatDate(o.createdAt)}
                  </p>
                </div>
                <StatusBadge status={o.status} />
                <span className="w-20 text-right font-semibold tabular-nums">
                  {formatPrice(o.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="New orders from the website show up here."
        />
      )}
    </Panel>
  )
}

function LowStock({ stats }: { stats: Dashboard }) {
  return (
    <Panel
      title="Low stock"
      icon={AlertTriangle}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/purchases">Restock</Link>
        </Button>
      }
    >
      {stats.lowStock.length ? (
        <ul className="divide-y">
          {stats.lowStock.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/60 md:px-5"
              >
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={p.image ?? "/placeholder.svg"}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
                <span className="line-clamp-1 flex-1">{p.name}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
                    p.stock === 0
                      ? "bg-red-50 text-red-800 ring-red-600/20"
                      : "bg-amber-50 text-amber-800 ring-amber-600/20"
                  )}
                >
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={CircleCheck} title="All products are well stocked" />
      )}
    </Panel>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-xl xl:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}
