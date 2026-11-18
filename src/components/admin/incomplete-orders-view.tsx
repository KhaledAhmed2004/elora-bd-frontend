"use client"

import { Phone, ShoppingCart, Trash2, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { WhatsappIcon } from "@/components/shared/social-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadCsv } from "@/lib/admin/finance"
import {
  adminActions,
  adminQueries,
  type Lead,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { getErrorMessage } from "@/lib/api"
import { formatDate, formatPhone, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

import { FilterTabs, PageHeader, Pager, QueryError } from "./admin-ui"

type Tab = "active" | "converted" | "dismissed"
const TABS: { value: Tab; label: string }[] = [
  { value: "active", label: "To call" },
  { value: "converted", label: "Converted" },
  { value: "dismissed", label: "Dismissed" },
]
const LEAD_KEYS = [["incomplete"], ["dashboard"]]

function timeAgo(iso: string, now: number) {
  const min = Math.round((now - new Date(iso).getTime()) / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h ago`
  return formatDate(iso)
}

export function IncompleteOrdersView() {
  const [tab, setTab] = useState<Tab>("active")
  const [page, setPage] = useState(1)
  const { data, error, refetch, dataUpdatedAt } = useAdminQuery(
    ["incomplete", "list", tab, page],
    () => adminQueries.leads({ status: tab, page, limit: 20 }),
    { placeholderData: (prev) => prev, refetchInterval: 60_000 }
  )
  const list = data?.data ?? []

  async function exportCsv() {
    try {
      const all = await adminQueries.leads({ status: tab, limit: 100 })
      downloadCsv(
        `incomplete-orders-${tab}.csv`,
        ["Date", "Name", "Phone", "District", "Products", "Subtotal", "Status", "Notes"],
        all.data.map((e) => [
          formatDate(e.updatedAt),
          e.fullName,
          e.phone,
          e.district,
          e.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
          e.subtotal,
          e.status,
          e.callNotes.map((n) => n.note).join("; "),
        ])
      )
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader
        title="Incomplete orders"
        description="Customers who typed their number at checkout but did not place the order"
      >
        <Button variant="outline" disabled={!list.length} onClick={exportCsv}>
          CSV
        </Button>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="admin-card p-4">
          <p className="text-xs text-muted-foreground">Waiting for a call</p>
          <p className="text-2xl font-bold tabular-nums">
            {data?.summary.waiting ?? "—"}
          </p>
        </div>
        <div className="admin-card p-4">
          <p className="text-xs text-muted-foreground">Cart value left behind</p>
          <p className="text-2xl font-bold tabular-nums">
            {data ? formatPrice(data.summary.value) : "—"}
          </p>
        </div>
      </div>

      <FilterTabs
        label="Lead status"
        tabs={TABS}
        value={tab}
        onChange={(v) => {
          setTab(v)
          setPage(1)
        }}
      />

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          Nothing here. Leads appear when a customer types a valid number at checkout and
          leaves without ordering.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {list.map((e) => (
              <LeadCard key={e.id} lead={e} now={dataUpdatedAt} />
            ))}
          </ul>
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

function LeadCard({ lead: e, now }: { lead: Lead; now: number }) {
  const [note, setNote] = useState("")
  const addNote = useAdminMutation((text: string) => adminActions.leadNote(e.id, text), {
    invalidate: LEAD_KEYS,
    success: "Call note saved",
    onSuccess: () => setNote(""),
  })
  const setStatus = useAdminMutation(
    (status: "open" | "dismissed") => adminActions.leadStatus(e.id, status),
    { invalidate: LEAD_KEYS }
  )
  const remove = useAdminMutation(() => adminActions.deleteLead(e.id), {
    invalidate: LEAD_KEYS,
    success: "Deleted",
  })
  const wa = `880${e.phone.slice(1)}`
  const waText = encodeURIComponent(
    `Hello${e.fullName ? ` ${e.fullName}` : ""}, you were about to order ${e.items
      .map((i) => i.name)
      .join(
        ", "
      )} on our website. Did you run into any trouble? We can confirm the order for you.`
  )
  const isActive = e.status === "open" || e.status === "called"

  return (
    <li className="space-y-3 admin-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {e.fullName || "Name not entered"}{" "}
            <span
              className={cn(
                "ml-1 rounded-full px-2 py-0.5 text-xs font-normal",
                e.status === "open" && "bg-amber-100 text-amber-800",
                e.status === "called" && "bg-sky-100 text-sky-800",
                e.status === "converted" && "bg-emerald-100 text-emerald-800",
                e.status === "dismissed" && "bg-zinc-200 text-zinc-700"
              )}
            >
              {e.status}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            <a href={`tel:${e.phone}`} className="text-primary">
              {formatPhone(e.phone)}
            </a>
            {e.district && ` · ${[e.upazila, e.district].filter(Boolean).join(", ")}`}
            {` · ${timeAgo(e.updatedAt, now)}`}
          </p>
        </div>
        <p className="text-lg font-bold tabular-nums">{formatPrice(e.subtotal)}</p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {e.items.map((i) => (
          <li
            key={`${i.productId}:${i.variantId ?? ""}`}
            className="flex items-center gap-2 rounded-lg border p-1.5 pr-3 text-xs"
          >
            <span className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
              <Image
                src={i.image ?? "/placeholder.svg"}
                alt=""
                fill
                sizes="36px"
                unoptimized
                className="object-cover"
              />
            </span>
            <span>
              <span className="line-clamp-1 font-medium">{i.name}</span>
              <span className="text-muted-foreground">
                {[i.color, i.size].filter(Boolean).join(" / ")}
                {(i.color || i.size) && " · "}
                {i.quantity} × {formatPrice(i.price)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {e.callNotes.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-muted/50 p-2 text-xs">
          {e.callNotes.map((n, i) => (
            <li key={i}>
              <span className="text-muted-foreground">
                {formatDate(n.at)}
                {n.by && ` · ${n.by}`}:
              </span>{" "}
              {n.note}
            </li>
          ))}
        </ul>
      )}

      {isActive ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <a href={`tel:${e.phone}`}>
              <Phone /> Call
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-[#25D366] text-white hover:bg-[#1ebe5b]"
          >
            <a
              href={`https://wa.me/${wa}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsappIcon className="size-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/orders/new?from=${e.id}`}>
              <ShoppingCart /> Create order
            </Link>
          </Button>
          <form
            className="flex min-w-56 flex-1 gap-2"
            onSubmit={(ev) => {
              ev.preventDefault()
              if (note.trim()) addNote.mutate(note.trim())
            }}
          >
            <Input
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              placeholder="Call note (e.g. will order on Friday)"
              aria-label="Call note"
              className="h-8"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={addNote.isPending}
            >
              Save
            </Button>
          </form>
          <Button
            size="sm"
            variant="ghost"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate("dismissed")}
          >
            <X /> Dismiss
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {e.orderId && (
            <Link
              href={`/admin/orders/${e.orderId}`}
              className="text-primary hover:underline"
            >
              View order
            </Link>
          )}
          {e.status === "dismissed" && (
            <Button size="sm" variant="outline" onClick={() => setStatus.mutate("open")}>
              Re-open
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto hover:text-destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      )}
    </li>
  )
}
