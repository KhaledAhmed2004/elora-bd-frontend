"use client"

import { Download, Info, TrendingDown, TrendingUp } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SOURCE_LABEL } from "@/lib/admin/constants"
import { downloadCsv, type PeriodKey, PERIODS, periodDays } from "@/lib/admin/finance"
import { adminQueries, type BreakdownRow, useAdminQuery } from "@/lib/admin/queries"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { PageHeader, QueryError } from "./admin-ui"

const BY = [
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "district", label: "District" },
  { value: "source", label: "Source" },
] as const

export function ReportsView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const allowed = can.manage(role)
  const [period, setPeriod] = useState<PeriodKey>("this-month")
  const range = periodDays(period)
  const {
    data: pl,
    error,
    refetch,
  } = useAdminQuery(["reports", "pl", period], () => adminQueries.profitLoss(range), {
    enabled: allowed,
  })
  const periodLabel = PERIODS.find((p) => p.value === period)!.label

  if (!allowed) return <NoAccess />
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader
        title="Reports — Profit & Loss"
        description="Only delivered orders are counted"
      >
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
          <SelectTrigger className="w-40" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 scrollbar-none max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {BY.map((b) => (
            <TabsTrigger key={b.value} value={b.value}>
              {b.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {!pl ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Sales (delivered)" value={formatPrice(pl.revenue)} />
                <Kpi label="Gross profit" value={formatPrice(pl.grossProfit)} />
                <Kpi
                  label="Net profit"
                  value={formatPrice(pl.netProfit)}
                  tone={pl.netProfit >= 0 ? "up" : "down"}
                  hint={`Margin ${pl.margin}%`}
                />
                <Kpi
                  label="Return rate"
                  value={`${pl.returnRate}%`}
                  hint={`${pl.returned} returned · ${pl.cancelled} cancelled`}
                  tone={pl.returned > pl.delivered * 0.2 ? "down" : undefined}
                />
              </ul>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="admin-card p-4">
                  <h2 className="mb-3 font-semibold">Profit & Loss ({periodLabel})</h2>
                  <dl className="space-y-2 text-sm">
                    <Line
                      label={`Sales — ${pl.delivered} delivered ${pl.delivered === 1 ? "order" : "orders"}`}
                      value={pl.revenue}
                    />
                    <Line label="(−) Product cost" value={-pl.productCost} />
                    <Line
                      label="(−) Courier charges (incl. returns)"
                      value={-pl.courierCost}
                    />
                    <Line label="Gross Profit" value={pl.grossProfit} strong />
                    <Line label="(−) Expenses" value={-pl.expenses} />
                    {pl.refunds > 0 && <Line label="(−) Refunds" value={-pl.refunds} />}
                    <Line label="Net Profit" value={pl.netProfit} strong big />
                  </dl>
                  <p className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                    Not yet delivered: {pl.inPipeline} orders (
                    {formatPrice(pl.pipelineValue)}) — they will be added here once
                    delivered.
                    {pl.estimatedCost &&
                      " Some products have no cost price, so 60% of the selling price was assumed for them."}
                  </p>
                </section>

                <section className="admin-card p-4">
                  <h2 className="mb-3 font-semibold">
                    Expenses ({formatPrice(pl.expenses)})
                  </h2>
                  {Object.keys(pl.expenseByCategory).length ? (
                    <ul className="space-y-2 text-sm">
                      {Object.entries(pl.expenseByCategory)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, amt]) => (
                          <li key={cat}>
                            <div className="mb-1 flex justify-between">
                              <span>{cat}</span>
                              <span className="tabular-nums">{formatPrice(amt)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${(amt / pl.expenses) * 100}%` }}
                              />
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="flex gap-2 text-sm text-muted-foreground">
                      <Info className="size-4 shrink-0" /> No expenses recorded for this
                      period. Add Facebook ads, packaging, etc. on the Expenses page to
                      see your real net profit.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}
        </TabsContent>

        {BY.map((b) => (
          <TabsContent key={b.value} value={b.value}>
            <Breakdown by={b.value} title={b.label} period={period} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function Breakdown({
  by,
  title,
  period,
}: {
  by: (typeof BY)[number]["value"]
  title: string
  period: PeriodKey
}) {
  const { data, error } = useAdminQuery(["reports", "breakdown", by, period], () =>
    adminQueries.breakdown({ by, ...periodDays(period) })
  )
  if (error) return <QueryError error={error} />
  if (!data) return <Skeleton className="h-64 rounded-xl" />
  const rows =
    by === "source"
      ? data.map((r) => ({
          ...r,
          label: SOURCE_LABEL[r.key as keyof typeof SOURCE_LABEL] ?? r.label,
        }))
      : data
  return (
    <BreakdownTable rows={rows} title={title} filename={`report-${by}-${period}.csv`} />
  )
}

function BreakdownTable({
  rows,
  title,
  filename,
}: {
  rows: BreakdownRow[]
  title: string
  filename: string
}) {
  const total = rows.reduce((s, r) => s + r.revenue, 0)
  return (
    <section className="overflow-hidden admin-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">Sales by {title}</h2>
        <Button
          size="sm"
          variant="outline"
          disabled={!rows.length}
          onClick={() =>
            downloadCsv(
              filename,
              [title, "Order", "Qty", "Sales", "Profit"],
              rows.map((r) => [r.label, r.orders, r.qty, r.revenue, r.profit])
            )
          }
        >
          <Download /> CSV
        </Button>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">{title}</th>
                <th className="px-4 py-2 text-right font-medium">Order</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Sales</th>
                <th className="px-4 py-2 text-right font-medium">Profit</th>
                <th className="w-40 px-4 py-2 font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="px-4 py-2">{r.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.orders}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.qty}</td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    {formatPrice(r.revenue)}
                  </td>
                  <td className="px-4 py-2 text-right text-primary tabular-nums">
                    {formatPrice(r.profit)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${total ? (r.revenue / total) * 100 : 0}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No delivered orders in this period
        </p>
      )}
    </section>
  )
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: "up" | "down"
}) {
  return (
    <li className="admin-card p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        {tone === "up" && <TrendingUp className="size-4 text-primary" />}
        {tone === "down" && <TrendingDown className="size-4 text-destructive" />}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums",
          tone === "down" && "text-destructive"
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </li>
  )
}

function Line({
  label,
  value,
  strong,
  big,
}: {
  label: string
  value: number
  strong?: boolean
  big?: boolean
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-3",
        strong && "border-t pt-2 font-semibold",
        big && "text-base"
      )}
    >
      <dt>{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          value < 0 && "text-muted-foreground",
          big && value < 0 && "text-destructive"
        )}
      >
        {value < 0 ? `−${formatPrice(-value)}` : formatPrice(value)}
      </dd>
    </div>
  )
}
