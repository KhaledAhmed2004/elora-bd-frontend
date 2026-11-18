"use client"

import { ArrowLeft, Ban, MapPin, Phone, Plus, Star, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

import { WhatsappIcon } from "@/components/shared/social-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { SOURCE_LABEL } from "@/lib/admin/constants"
import {
  adminActions,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { isApiStatus } from "@/lib/api"
import { formatDate, formatPhone, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

import { PageHeader, QueryError, StatusBadge } from "./admin-ui"
import { RiskBadge } from "./risk-badge"

const SUGGESTED_TAGS = [
  "VIP",
  "Regular",
  "Wholesale",
  "Gift buyer",
  "Size issue",
  "Bargainer",
  "Problem",
]

/** Uses useParams → rendered inside the admin layout's <Suspense>. */
export function CustomerDetailView() {
  const { phone: raw } = useParams<{ phone: string }>()
  const phone = decodeURIComponent(raw)
  const key = ["customers", "detail", phone]
  const {
    data: c,
    error,
    refetch,
  } = useAdminQuery(key, () => adminQueries.customer(phone))
  const [note, setNote] = useState("")
  const [customTag, setCustomTag] = useState("")

  const touch = [key, ["customers", "list"]]
  const setTags = useAdminMutation(
    (tags: string[]) => adminActions.customerTags(phone, tags),
    {
      invalidate: touch,
    }
  )
  const addNote = useAdminMutation(
    (text: string) => adminActions.customerNote(phone, text),
    {
      invalidate: touch,
      success: "Note added",
      onSuccess: () => setNote(""),
    }
  )
  const removeNote = useAdminMutation(
    (noteId: string) => adminActions.deleteCustomerNote(phone, noteId),
    { invalidate: touch }
  )
  const blacklist = useAdminMutation(
    (reason: string) => adminActions.blacklist(phone, reason),
    {
      invalidate: [...touch, ["blacklist"], ["orders"]],
      success: "Added to blacklist",
    }
  )
  const unblacklist = useAdminMutation(() => adminActions.unblacklist(phone), {
    invalidate: [...touch, ["blacklist"], ["orders"]],
    success: "Removed from blacklist",
  })

  if (error && isApiStatus(error, 404)) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="font-semibold">No orders found for this number</p>
        <Button asChild variant="outline">
          <Link href="/admin/customers">Back to customers</Link>
        </Button>
      </div>
    )
  }
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />
  if (!c) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  const tags = c.tags
  const allTags = [...new Set([...SUGGESTED_TAGS, ...tags])]
  const toggleTag = (t: string) =>
    setTags.mutate(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/customers">
          <ArrowLeft /> Customers
        </Link>
      </Button>
      <PageHeader title={c.name || formatPhone(phone)} description={formatPhone(phone)}>
        <Button asChild variant="outline">
          <a href={`tel:${phone}`}>
            <Phone /> Call
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href={`https://wa.me/880${phone.slice(1)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsappIcon className="size-4" /> WhatsApp
          </a>
        </Button>
        <Button asChild>
          <Link href="/admin/orders/new">
            <Plus /> New order
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total orders" value={c.stats.orders} />
        <Stat label="Delivered" value={c.stats.delivered} />
        <Stat
          label="Returned"
          value={c.stats.returned}
          tone={c.stats.returned ? "bad" : undefined}
        />
        <Stat label="Cancelled" value={c.stats.cancelled} />
        <Stat label="Total spent" value={formatPrice(c.stats.spent)} />
        <Stat label="Avg. order" value={formatPrice(c.stats.averageOrder)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="overflow-hidden admin-card">
            <h2 className="border-b px-4 py-3 font-semibold">Orders</h2>
            <ul className="divide-y">
              {c.orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm hover:bg-muted/50"
                  >
                    <span className="font-medium">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(o.createdAt)} · {SOURCE_LABEL[o.source ?? "website"]}
                    </span>
                    <span className="ml-auto font-semibold tabular-nums">
                      {formatPrice(o.total)}
                    </span>
                    <span className="w-full truncate text-xs text-muted-foreground">
                      {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 admin-card p-4">
            <h2 className="font-semibold">Notes</h2>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (note.trim()) addNote.mutate(note.trim())
              }}
            >
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="E.g. prefers delivery after 5pm, size L fits her best"
                aria-label="New note"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!note.trim() || addNote.isPending}
              >
                Add note
              </Button>
            </form>
            {c.notes.length > 0 && (
              <ul className="space-y-2">
                {c.notes.map((n) => (
                  <li
                    key={n.id}
                    className="flex gap-2 rounded-lg bg-muted/50 p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-line">{n.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.by} · {formatDate(n.at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete note"
                      disabled={removeNote.isPending}
                      onClick={() => removeNote.mutate(n.id)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-3 admin-card p-4">
            <h2 className="font-semibold">Risk & status</h2>
            <RiskBadge risk={c.risk} />
            {c.blacklist ? (
              <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <p>
                  <b>Blacklisted:</b> {c.blacklist.reason}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unblacklist.isPending}
                  onClick={() => unblacklist.mutate()}
                >
                  Remove from blacklist
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="hover:text-destructive"
                disabled={blacklist.isPending}
                onClick={() => {
                  const reason = window.prompt("Reason for blacklisting?")
                  if (reason?.trim()) blacklist.mutate(reason.trim())
                }}
              >
                <Ban /> Blacklist
              </Button>
            )}
          </section>

          <section className="space-y-3 admin-card p-4">
            <h2 className="font-semibold">Tags</h2>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => {
                const on = tags.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    disabled={setTags.isPending}
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary"
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const t = customTag.trim()
                if (t && !tags.includes(t)) setTags.mutate([...tags, t])
                setCustomTag("")
              }}
            >
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Custom tag"
                aria-label="Custom tag"
                maxLength={30}
                className="h-8"
              />
              <Button type="submit" size="sm" variant="outline">
                Add
              </Button>
            </form>
          </section>

          <section className="space-y-2 admin-card p-4 text-sm">
            <h2 className="font-semibold">Addresses used</h2>
            <ul className="space-y-1.5">
              {c.addresses.map((a) => (
                <li key={a} className="flex gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" /> {a}
                </li>
              ))}
            </ul>
            {c.stats.firstOrder && c.stats.lastOrder && (
              <p className="pt-2 text-xs text-muted-foreground">
                First order {formatDate(c.stats.firstOrder)} · Last order{" "}
                {formatDate(c.stats.lastOrder)}
              </p>
            )}
          </section>

          {c.bought.length > 0 && (
            <section className="space-y-2 admin-card p-4 text-sm">
              <h2 className="font-semibold">Bought</h2>
              <ul className="space-y-1">
                {c.bought.map((p) => (
                  <li key={p.name} className="flex justify-between gap-2">
                    <span className="truncate">{p.name}</span>
                    <span className="text-muted-foreground tabular-nums">×{p.qty}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {c.reviews.length > 0 && (
            <section className="space-y-2 admin-card p-4 text-sm">
              <h2 className="font-semibold">Reviews</h2>
              <ul className="space-y-2">
                {c.reviews.map((r) => (
                  <li key={r.id}>
                    <span className="inline-flex items-center gap-0.5 font-medium">
                      {r.rating}
                      <Star className="size-3 fill-current" />
                    </span>{" "}
                    {r.text}{" "}
                    <span className="text-xs text-muted-foreground">({r.status})</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: "bad"
}) {
  return (
    <div className="admin-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums",
          tone === "bad" && "text-destructive"
        )}
      >
        {value}
      </p>
    </div>
  )
}
