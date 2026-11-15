"use client"

import { AlertTriangle, Banknote, Clock, ShoppingBag, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { adminQueries, useAdminQuery } from "@/lib/admin/queries"
import { formatDate, formatPrice } from "@/lib/format"
import type { OrderStatus } from "@/types"

import { PageHeader, QueryError, StatusBadge } from "./admin-ui"

const chartConfig = {
  revenue: { label: "Sales (৳)", color: "var(--chart-3)" },
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

/** "2026-11-13" → "13 Nov" */
const shortDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })

export function DashboardView() {
  const {
    data: stats,
    error,
    refetch,
  } = useAdminQuery(["dashboard"], adminQueries.dashboard, {
    refetchInterval: 30_000,
  })
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />
  if (!stats) return <DashboardSkeleton />

  const series = stats.revenueSeries.map((p) => ({ ...p, date: shortDay(p.date) }))
  const totalOrders = Object.values(stats.statusBreakdown).reduce(
    (a, b) => a + (b ?? 0),
    0
  )
  const lowStock = stats.lowStock

  const cards = [
    { label: "Today's sales", value: formatPrice(stats.todayRevenue), icon: Banknote },
    { label: "Today's orders", value: stats.todayOrders, icon: ShoppingBag },
    {
      label: "Pending orders",
      value: stats.pending,
      icon: Clock,
      href: "/admin/orders?status=pending",
    },
    {
      label: "Total customers",
      value: stats.customers,
      icon: Users,
      href: "/admin/customers",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Sales this month: ${formatPrice(stats.monthRevenue)}`}
      />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => {
          const body = (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {label}
                <Icon className="size-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            </>
          )
          return (
            <li key={label}>
              {href ? (
                <Link
                  href={href}
                  className="block rounded-xl border bg-card p-4 transition-colors hover:border-primary"
                >
                  {body}
                </Link>
              ) : (
                <div className="rounded-xl border bg-card p-4">{body}</div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border bg-card p-4 xl:col-span-2">
          <h2 className="mb-4 font-semibold">Sales (last 14 days)</h2>
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <BarChart data={series} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <span className="flex w-full justify-between gap-4">
                        <span>{formatPrice(Number(value))}</span>
                        <span className="text-muted-foreground">
                          {(item.payload as { orders: number }).orders} orders
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 font-semibold">Order status</h2>
          <ul className="space-y-2.5">
            {STATUS_ORDER.map((s) => {
              const n = stats.statusBreakdown[s] ?? 0
              const pct = totalOrders ? (n / totalOrders) * 100 : 0
              return (
                <li key={s} className="text-sm">
                  <Link
                    href={`/admin/orders?status=${s}`}
                    className="block space-y-1 hover:opacity-80"
                  >
                    <span className="flex justify-between">
                      <StatusBadge status={s} />
                      <span className="font-medium tabular-nums">{n}</span>
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border bg-card xl:col-span-2">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y">
            {stats.recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {o.orderNumber}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {o.shipName}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.createdAt)}
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
        </section>

        <section className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <AlertTriangle className="size-4 text-amber-600" />
            <h2 className="font-semibold">Low stock</h2>
          </div>
          {lowStock.length ? (
            <ul className="divide-y">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50"
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
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
                      className={
                        p.stock === 0
                          ? "font-semibold text-destructive"
                          : "font-semibold text-amber-600"
                      }
                    >
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              All products are well stocked
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
