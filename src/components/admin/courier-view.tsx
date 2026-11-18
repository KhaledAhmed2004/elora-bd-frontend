"use client"

import { Banknote, Download, Truck, Undo2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { downloadCsv } from "@/lib/admin/finance"
import {
  adminActions,
  type AdminOrder,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { formatDate, formatPrice } from "@/lib/format"
import { codDue } from "@/lib/orders"
import { cn } from "@/lib/utils"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { FilterTabs, PageHeader, QueryError, StatusBadge } from "./admin-ui"
import {
  type AdminColumn,
  columnHelper,
  DataTable,
  type RowSelectionState,
} from "./data-table"

type Tab = "due" | "transit" | "settled" | "all"
const TABS: { value: Tab; label: string }[] = [
  { value: "due", label: "Payment due" },
  { value: "transit", label: "In transit" },
  { value: "settled", label: "Received" },
  { value: "all", label: "All" },
]

type Order = AdminOrder

/** What a parcel means for the shop's cash: COD collected minus the courier charge */
function courierPayable(o: Order) {
  const charge = o.courier?.charge ?? 0
  if (o.status === "delivered") return codDue({ ...o, paymentStatus: "unpaid" }) - charge
  if (o.status === "returned") return -charge
  return 0
}

const settleable = (o: Order) =>
  (o.status === "delivered" || o.status === "returned") && !o.courier?.settled

const h = columnHelper<Order>()
const columns: AdminColumn<Order>[] = [
  h.accessor("orderNumber", {
    header: "Order",
    cell: (c) => (
      <div>
        <p className="font-medium">{c.row.original.orderNumber}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(c.row.original.createdAt)}
        </p>
      </div>
    ),
  }),
  h.accessor((o) => `${o.courier?.name} ${o.courier?.trackingId}`, {
    id: "courier",
    header: "Courier",
    cell: (c) => (
      <div className="text-sm">
        <p>{c.row.original.courier?.name}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {c.row.original.courier?.trackingId}
        </p>
      </div>
    ),
  }),
  h.accessor("status", {
    header: "Status",
    cell: (c) => <StatusBadge status={c.row.original.status} />,
  }),
  h.accessor(
    (o) => (o.status === "delivered" ? codDue({ ...o, paymentStatus: "unpaid" }) : 0),
    {
      id: "cod",
      header: "COD",
      sortFn: "basic",
      cell: (c) => (
        <span className="tabular-nums">{formatPrice(c.getValue() as number)}</span>
      ),
    }
  ),
  h.accessor((o) => o.courier?.charge ?? 0, {
    id: "charge",
    header: "Charge",
    sortFn: "basic",
    cell: (c) => (
      <span className="text-muted-foreground tabular-nums">
        −{formatPrice(c.getValue() as number)}
      </span>
    ),
  }),
  h.accessor((o) => courierPayable(o), {
    id: "payable",
    header: "Payable",
    sortFn: "basic",
    cell: (c) => {
      const v = c.getValue() as number
      return (
        <span className={cn("font-semibold tabular-nums", v < 0 && "text-destructive")}>
          {v < 0 ? `−${formatPrice(-v)}` : formatPrice(v)}
        </span>
      )
    },
  }),
  h.accessor((o) => (o.courier?.settled ? "settled" : "due"), {
    id: "settled",
    header: "Settlement",
    cell: (c) => {
      const o = c.row.original
      if (o.courier?.settled)
        return (
          <span className="text-xs text-primary">
            ✓ {o.courier.settledAt ? formatDate(o.courier.settledAt) : "Received"}
          </span>
        )
      if (settleable(o))
        return (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
            Due
          </span>
        )
      return <span className="text-xs text-muted-foreground">Not delivered</span>
    },
  }),
]

export function CourierView() {
  const router = useRouter()
  const role = useAdminAuthStore((s) => s.admin?.role)
  const [tab, setTab] = useState<Tab>("due")
  const [selection, setSelection] = useState<RowSelectionState>({})
  // Every parcel still owed (up to 500) + the most recent 200 received
  const unsettled = useAdminQuery(["orders", "courier", "unsettled"], () =>
    adminQueries.orders({ courierSettled: "false", limit: 500 })
  )
  const settled = useAdminQuery(["orders", "courier", "settled"], () =>
    adminQueries.orders({ courierSettled: "true", limit: 200 })
  )
  const settle = useAdminMutation((ids: string[]) => adminActions.settle(ids), {
    invalidate: [["orders"], ["dashboard"]],
    success: (r) =>
      `${r.updated} ${r.updated === 1 ? "parcel" : "parcels"} marked as paid`,
    onSuccess: () => setSelection({}),
  })

  const shipped = [...(unsettled.data?.data ?? []), ...(settled.data?.data ?? [])]
  const rows = shipped.filter((o) =>
    tab === "due"
      ? settleable(o)
      : tab === "transit"
        ? o.status === "shipped"
        : tab === "settled"
          ? o.courier?.settled
          : true
  )
  const due = shipped.filter(settleable).reduce((s, o) => s + courierPayable(o), 0)
  const transit = shipped
    .filter((o) => o.status === "shipped")
    .reduce((s, o) => s + codDue(o) - (o.courier?.charge ?? 0), 0)
  const returns = shipped.filter((o) => o.status === "returned").length
  const selectedIds = Object.keys(selection)
  const selectedTotal = shipped
    .filter((o) => selectedIds.includes(o.id))
    .reduce((s, o) => s + courierPayable(o), 0)

  return (
    <div>
      <PageHeader
        title="Courier & COD"
        description="How much the courier owes you, and how much you have received"
      >
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              `courier-cod-${new Date().toISOString().slice(0, 10)}.csv`,
              [
                "Order",
                "Courier",
                "Tracking",
                "Status",
                "COD",
                "Charge",
                "Payable",
                "Settled",
              ],
              rows.map((o) => [
                o.orderNumber,
                o.courier?.name ?? "",
                o.courier?.trackingId ?? "",
                o.status,
                o.status === "delivered" ? codDue({ ...o, paymentStatus: "unpaid" }) : 0,
                o.courier?.charge ?? 0,
                courierPayable(o),
                o.courier?.settled ? "yes" : "no",
              ])
            )
          }
        >
          <Download /> CSV
        </Button>
      </PageHeader>

      <ul className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat
          icon={Banknote}
          label="Due from courier"
          value={formatPrice(due)}
          tone="amber"
        />
        <Stat icon={Truck} label="In transit (expected)" value={formatPrice(transit)} />
        <Stat icon={Undo2} label="Returned parcels" value={String(returns)} tone="red" />
      </ul>

      <FilterTabs
        label="Settlement status"
        tabs={TABS}
        value={tab}
        onChange={(v) => {
          setTab(v)
          setSelection({})
        }}
      />

      {selectedIds.length > 0 && (
        <div
          role="toolbar"
          aria-label="Settlement"
          className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-accent p-2.5"
        >
          <span className="px-1 text-sm font-semibold">
            {selectedIds.length} selected · {formatPrice(selectedTotal)}
          </span>
          {can.manage(role) ? (
            <Button
              size="sm"
              disabled={settle.isPending}
              onClick={() =>
                settle.mutate(
                  shipped
                    .filter((o) => selectedIds.includes(o.id) && settleable(o))
                    .map((o) => o.id)
                )
              }
            >
              <Banknote /> Mark as Received
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              A manager marks COD as received
            </span>
          )}
        </div>
      )}

      {unsettled.error ? (
        <QueryError error={unsettled.error} onRetry={() => void unsettled.refetch()} />
      ) : (
        <DataTable
          key={tab}
          columns={columns}
          data={rows}
          pageSize={15}
          emptyText={unsettled.data ? "Nothing here" : "Loading..."}
          getRowId={(o) => o.id}
          selection={selection}
          onSelectionChange={setSelection}
          onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
        />
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Banknote
  label: string
  value: string
  tone?: "amber" | "red"
}) {
  return (
    <li className="admin-card p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <Icon
          className={cn(
            "size-4",
            tone === "amber"
              ? "text-amber-600"
              : tone === "red"
                ? "text-destructive"
                : "text-primary"
          )}
        />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </li>
  )
}
