"use client"

import {
  CheckCheck,
  Download,
  PackageOpen,
  Plus,
  Printer,
  Search,
  Tag,
  Truck,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebounced } from "@/hooks/use-debounced"
import { COURIERS, type CourierName, SOURCE_LABEL } from "@/lib/admin/constants"
import { downloadCsv } from "@/lib/admin/finance"
import {
  adminActions,
  type AdminOrder,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { getErrorMessage } from "@/lib/api"
import { formatDate, formatPrice } from "@/lib/format"
import { codDue } from "@/lib/orders"
import { cn } from "@/lib/utils"
import { variantShort } from "@/lib/variants"
import type { OrderStatus } from "@/types"

import { PAYMENT_LABEL, PageHeader, Pager, QueryError, StatusBadge } from "./admin-ui"
import {
  type AdminColumn,
  columnHelper,
  DataTable,
  type RowSelectionState,
} from "./data-table"
import { Invoice } from "./invoice"
import { RiskBadge } from "./risk-badge"
import { ShippingLabel } from "./shipping-label"

const TABS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending (Call)" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Packing" },
  { value: "shipped", label: "With courier" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
]

type Row = AdminOrder

const PAGE_SIZE = 20

const h = columnHelper<Row>()
const columns: AdminColumn<Row>[] = [
  h.accessor("orderNumber", {
    header: "Order",
    cell: (c) => (
      <div>
        <p className="font-medium">{c.row.original.orderNumber}</p>
        <p className="text-xs text-muted-foreground">
          {SOURCE_LABEL[c.row.original.source ?? "website"]}
        </p>
      </div>
    ),
  }),
  h.accessor("createdAt", {
    header: "Date",
    sortFn: "datetime",
    cell: (c) => (
      <span className="text-muted-foreground">
        {formatDate(c.row.original.createdAt)}
      </span>
    ),
  }),
  h.accessor((o) => `${o.shippingAddress.fullName} ${o.shippingAddress.phone}`, {
    id: "customer",
    header: "Customer",
    enableSorting: false,
    cell: (c) => (
      <div>
        <p>{c.row.original.shippingAddress.fullName}</p>
        <p className="text-xs text-muted-foreground">
          {c.row.original.shippingAddress.phone}
        </p>
      </div>
    ),
  }),
  h.accessor((o) => o.risk.level, {
    id: "risk",
    header: "Risk",
    cell: (c) => <RiskBadge risk={c.row.original.risk} />,
  }),
  h.accessor((o) => o.shippingAddress.district, { id: "district", header: "District" }),
  h.accessor("total", {
    header: "Total",
    sortFn: "basic",
    cell: (c) => (
      <span className="font-semibold tabular-nums">
        {formatPrice(c.row.original.total)}
      </span>
    ),
  }),
  h.accessor("paymentMethod", {
    header: "Payment",
    cell: (c) => {
      const o = c.row.original
      return (
        <span className="text-xs">
          {PAYMENT_LABEL[o.paymentMethod]}
          {o.paymentStatus === "paid" && (
            <span className="ml-1 text-primary">✓ Paid</span>
          )}
          {o.advance && !o.advance.verified && (
            <span className="ml-1 rounded bg-amber-100 px-1 text-amber-800">
              Verify advance
            </span>
          )}
        </span>
      )
    },
  }),
  h.accessor("status", {
    header: "Status",
    cell: (c) => {
      const o = c.row.original
      return (
        <div className="flex flex-col items-start gap-0.5">
          <StatusBadge status={o.status} />
          {o.status === "pending" && (o.callLog?.length ?? 0) > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {o.callLog!.length} call(s)
            </span>
          )}
        </div>
      )
    },
  }),
]

/** Uses useSearchParams → rendered inside the admin layout's <Suspense>. */
export function OrdersView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const status = (searchParams.get("status") ?? "all") as OrderStatus | "all"
  const [search, setSearch] = useState("")
  const q = useDebounced(search.trim(), 350)
  const [page, setPage] = useState(1)
  const [selection, setSelection] = useState<RowSelectionState>({})
  const [courier, setCourier] = useState<CourierName>("Steadfast")
  const [printMode, setPrintMode] = useState<"invoice" | "label">("invoice")
  const [exporting, setExporting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const print = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Orders",
    pageStyle:
      "@page { size: A4; margin: 10mm } @media print { .page-break { break-after: page } }",
  })

  const filter = { status: status === "all" ? undefined : status, q }
  const { data, error, refetch, isFetching } = useAdminQuery(
    ["orders", "list", filter, page],
    () => adminQueries.orders({ ...filter, page, limit: PAGE_SIZE }),
    { placeholderData: (prev) => prev }
  )
  const { data: counts } = useAdminQuery(["orders", "counts"], adminQueries.orderCounts)
  const rows = data?.data ?? []
  const selectedIds = Object.keys(selection)
  const selectedOrders = rows.filter((o) => selectedIds.includes(o.id))
  const count = (v: OrderStatus | "all") => counts?.[v] ?? 0

  const clearSelection = () => setSelection({})
  const bulkStatus = useAdminMutation(
    ({ ids, status: to }: { ids: string[]; status: OrderStatus }) =>
      adminActions.bulkStatus(ids, to),
    {
      invalidate: [["orders"], ["dashboard"]],
      success: (r, v) =>
        `${r.done.length} order(s) marked ${v.status}` +
        (r.failed.length ? ` · ${r.failed.length} skipped: ${r.failed[0].error}` : ""),
      onSuccess: clearSelection,
    }
  )
  const bookCourier = useAdminMutation(
    (ids: string[]) => adminActions.bookCourier(ids, courier),
    {
      invalidate: [["orders"], ["dashboard"]],
      success: (r) =>
        `${r.booked.length} order(s) booked with ${courier}` +
        (r.skipped.length
          ? ` · ${r.skipped.length} skipped (pending or already booked)`
          : ""),
      onSuccess: clearSelection,
    }
  )
  const busy = bulkStatus.isPending || bookCourier.isPending

  /** Selected orders, or every order in the current tab (up to 500) */
  async function exportCsv() {
    setExporting(true)
    try {
      const list = selectedOrders.length
        ? selectedOrders
        : (await adminQueries.orders({ ...filter, limit: 500 })).data
      downloadCsv(
        `orders-${status}-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Order",
          "Date",
          "Status",
          "Source",
          "Name",
          "Phone",
          "District",
          "Upazila",
          "Address",
          "Products",
          "Subtotal",
          "Delivery",
          "Discount",
          "Total",
          "Payment",
          "COD due",
          "Courier",
          "Tracking",
          "Note",
        ],
        list.map((o) => {
          const a = o.shippingAddress
          return [
            o.orderNumber,
            formatDate(o.createdAt),
            o.status,
            SOURCE_LABEL[o.source ?? "website"],
            a.fullName,
            a.phone,
            a.district,
            a.upazila,
            a.address,
            o.items
              .map((i) => {
                const v = variantShort(i.attributes)
                return `${i.name}${v ? ` (${v})` : ""} x${i.quantity}`
              })
              .join("; "),
            o.subtotal,
            o.deliveryCharge,
            o.discount,
            o.total,
            PAYMENT_LABEL[o.paymentMethod],
            codDue(o),
            o.courier?.name ?? "",
            o.courier?.trackingId ?? "",
            o.note ?? "",
          ]
        })
      )
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setExporting(false)
    }
  }

  function printAll(mode: "invoice" | "label") {
    setPrintMode(mode)
    // let React render the chosen layout before printing
    requestAnimationFrame(() => print())
  }

  return (
    <div>
      <PageHeader title="Orders" description={`${count("all")} orders total`}>
        <Button
          variant="outline"
          disabled={!rows.length || exporting}
          onClick={exportCsv}
        >
          <Download /> {selectedIds.length ? `CSV (${selectedIds.length})` : "CSV"}
        </Button>
        <Button asChild>
          <Link href="/admin/orders/new">
            <Plus /> New order
          </Link>
        </Button>
      </PageHeader>

      <div className="-mx-4 mb-4 scrollbar-none flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setSelection({})
              setPage(1)
              router.replace(
                t.value === "all" ? pathname : `${pathname}?status=${t.value}`,
                {
                  scroll: false,
                }
              )
            }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
              status === t.value
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {t.label} <span className="opacity-70">({count(t.value)})</span>
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Order no., name or phone..."
          className="pl-9"
          aria-label="Search orders"
        />
      </div>

      {selectedIds.length > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="sticky top-14 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-accent p-2.5 shadow-sm"
        >
          <span className="px-1 text-sm font-semibold">
            {selectedIds.length} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => bulkStatus.mutate({ ids: selectedIds, status: "confirmed" })}
          >
            <CheckCheck /> Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => bulkStatus.mutate({ ids: selectedIds, status: "processing" })}
          >
            <PackageOpen /> Packing
          </Button>
          <div className="flex items-center gap-1">
            <Select value={courier} onValueChange={(v) => setCourier(v as CourierName)}>
              <SelectTrigger
                size="sm"
                className="w-28 bg-background"
                aria-label="Courier"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COURIERS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => bookCourier.mutate(selectedIds)}
            >
              <Truck /> Send to courier
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => printAll("invoice")}>
            <Printer /> Invoice
          </Button>
          <Button size="sm" variant="outline" onClick={() => printAll("label")}>
            <Tag /> Label
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="ml-auto"
            aria-label="Clear selection"
            onClick={() => setSelection({})}
          >
            <X />
          </Button>
        </div>
      )}

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : (
        <div className={cn(isFetching && "opacity-70 transition-opacity")}>
          <DataTable
            key={`${status}-${page}`}
            columns={columns}
            data={rows}
            pageSize={PAGE_SIZE}
            emptyText={data ? "No orders here" : "Loading..."}
            onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
            getRowId={(o) => o.id}
            selection={selection}
            onSelectionChange={setSelection}
          />
          {data && (
            <Pager
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onChange={(p) => {
                setPage(p)
                setSelection({})
              }}
            />
          )}
        </div>
      )}

      {/* Print-only content */}
      <div className="hidden">
        <div ref={printRef}>
          {printMode === "invoice" ? (
            selectedOrders.map((o) => (
              <div key={o.id} className="page-break">
                <Invoice order={o} />
              </div>
            ))
          ) : (
            <div className="grid grid-cols-2 gap-[6mm]">
              {selectedOrders.map((o) => (
                <ShippingLabel key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
