"use client"

import { Download } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounced } from "@/hooks/use-debounced"
import { downloadCsv } from "@/lib/admin/finance"
import { adminQueries, useAdminQuery } from "@/lib/admin/queries"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { PageHeader, Pager, QueryError } from "./admin-ui"

/** The part of the action before the dot, e.g. "order.status" → "order" */
const GROUPS = {
  order: "Orders",
  product: "Products",
  catalog: "Catalog",
  stock: "Stock & purchases",
  customer: "Customers",
  review: "Reviews",
  accounts: "Expenses",
  staff: "Staff",
  auth: "Sign-ins",
  settings: "Settings",
} as const

const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })

export function ActivityView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const allowed = can.manage(role)
  const [group, setGroup] = useState<keyof typeof GROUPS | "all">("all")
  const [search, setSearch] = useState("")
  const q = useDebounced(search.trim(), 350)
  const [page, setPage] = useState(1)
  const params = { group: group === "all" ? undefined : group, q }
  const { data, error, refetch } = useAdminQuery(
    ["activity", params, page],
    () => adminQueries.activity({ ...params, page, limit: 50 }),
    { enabled: allowed, placeholderData: (prev) => prev }
  )

  if (!allowed) return <NoAccess />
  const list = data?.data ?? []

  return (
    <div>
      <PageHeader title="Activity log" description="Who changed what in the admin panel">
        <Button
          variant="outline"
          disabled={!list.length}
          onClick={async () => {
            try {
              const all = await adminQueries.activity({ ...params, limit: 200 })
              downloadCsv(
                "activity-log.csv",
                ["Time", "By", "Action", "Details"],
                all.data.map((e) => [
                  new Date(e.at).toLocaleString("en-GB"),
                  e.actor,
                  e.action,
                  e.message,
                ])
              )
            } catch (e) {
              toast.error(getErrorMessage(e))
            }
          }}
        >
          <Download /> CSV
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search order no., product, person..."
          aria-label="Search activity"
          className="w-full sm:max-w-xs"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["all", ...Object.keys(GROUPS)] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGroup(g as keyof typeof GROUPS | "all")
                setPage(1)
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                group === g
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary"
              )}
            >
              {g === "all" ? "All" : GROUPS[g as keyof typeof GROUPS]}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          Nothing recorded yet
        </p>
      ) : (
        <>
          <ol className="divide-y admin-card">
            {list.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5 text-sm"
              >
                <time
                  dateTime={e.at}
                  className="w-28 shrink-0 text-xs text-muted-foreground tabular-nums"
                >
                  {stamp(e.at)}
                </time>
                <span className="shrink-0 text-xs font-medium">{e.actor}</span>
                <span className="min-w-0 flex-1">
                  {e.href ? (
                    <Link href={e.href} className="hover:text-primary hover:underline">
                      {e.message}
                    </Link>
                  ) : (
                    e.message
                  )}
                </span>
              </li>
            ))}
          </ol>
          <Pager
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}
