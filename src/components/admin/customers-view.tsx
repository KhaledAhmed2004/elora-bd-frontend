"use client"

import { Download, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounced } from "@/hooks/use-debounced"
import { downloadCsv } from "@/lib/admin/finance"
import { adminQueries, type CustomerRow, useAdminQuery } from "@/lib/admin/queries"
import { getErrorMessage } from "@/lib/api"
import { formatDate, formatPhone, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

import { PageHeader, Pager, QueryError } from "./admin-ui"
import { type AdminColumn, columnHelper, DataTable } from "./data-table"

const PAGE_SIZE = 20

const h = columnHelper<CustomerRow>()
const columns: AdminColumn<CustomerRow>[] = [
  h.accessor("name", {
    header: "Name",
    enableSorting: false,
    cell: (c) => (
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
          {(c.row.original.name || "?").charAt(0)}
        </span>
        <span className="font-medium">{c.row.original.name || "—"}</span>
        {c.row.original.tags.slice(0, 2).map((t) => (
          <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
            {t}
          </span>
        ))}
      </div>
    ),
  }),
  h.accessor("phone", {
    header: "Phone",
    enableSorting: false,
    cell: (c) => (
      <a
        href={`tel:${c.row.original.phone}`}
        className="text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {formatPhone(c.row.original.phone)}
      </a>
    ),
  }),
  h.accessor("district", { header: "District", enableSorting: false }),
  h.accessor("orders", { header: "Orders", enableSorting: false }),
  h.accessor("spent", {
    header: "Total spent",
    enableSorting: false,
    cell: (c) => (
      <span className="font-semibold tabular-nums">
        {formatPrice(c.row.original.spent)}
      </span>
    ),
  }),
  h.accessor("lastOrder", {
    header: "Last order",
    enableSorting: false,
    cell: (c) => (
      <span className="text-muted-foreground">
        {formatDate(c.row.original.lastOrder)}
      </span>
    ),
  }),
]

const SORTS = [
  { value: "spent", label: "Top spenders" },
  { value: "orders", label: "Most orders" },
  { value: "recent", label: "Recent" },
  { value: "name", label: "Name" },
] as const

export function CustomersView() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const q = useDebounced(search.trim(), 350)
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("spent")
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const { data, error, refetch, isFetching } = useAdminQuery(
    ["customers", "list", q, sort, page],
    () => adminQueries.customers({ q, sort, page, limit: PAGE_SIZE }),
    { placeholderData: (prev) => prev }
  )

  async function exportCsv() {
    setExporting(true)
    try {
      const all = await adminQueries.customers({ q, sort, limit: 1000 })
      downloadCsv(
        "customers.csv",
        ["Name", "Phone", "District", "Orders", "Total spent", "Last order", "Tags"],
        all.data.map((c) => [
          c.name,
          c.phone,
          c.district,
          c.orders,
          c.spent,
          formatDate(c.lastOrder),
          c.tags.join("; "),
        ])
      )
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description={data ? `${data.meta.total} customers` : "Everyone who has ordered"}
      >
        <Button
          variant="outline"
          disabled={!data?.data.length || exporting}
          onClick={exportCsv}
        >
          <Download /> CSV
        </Button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Name, phone or district..."
            className="pl-9"
            aria-label="Search customers"
          />
        </div>
        <div className="flex gap-1" role="group" aria-label="Sort">
          {SORTS.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={sort === s.value ? "default" : "outline"}
              aria-pressed={sort === s.value}
              onClick={() => {
                setSort(s.value)
                setPage(1)
              }}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : (
        <div className={cn(isFetching && "opacity-70 transition-opacity")}>
          <DataTable
            key={`${q}-${sort}-${page}`}
            columns={columns}
            data={data?.data ?? []}
            pageSize={PAGE_SIZE}
            emptyText={data ? "No customers found" : "Loading..."}
            onRowClick={(c) => router.push(`/admin/customers/${c.phone}`)}
          />
          {data && (
            <Pager
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  )
}
