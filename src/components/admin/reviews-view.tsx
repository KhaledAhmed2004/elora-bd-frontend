"use client"

import { BadgeCheck, Check, EyeOff, MessageSquareReply, Star, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDebounced } from "@/hooks/use-debounced"
import {
  adminActions,
  type AdminReview,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { formatDate, formatPhone } from "@/lib/format"
import { cn } from "@/lib/utils"

import { PageHeader, Pager, QueryError } from "./admin-ui"

type Status = AdminReview["status"]
const TABS: { value: Status | "all"; label: string }[] = [
  { value: "pending", label: "Waiting for approval" },
  { value: "approved", label: "Approved" },
  { value: "hidden", label: "Hidden" },
  { value: "all", label: "All" },
]
const REVIEW_KEYS = [["reviews"], ["dashboard"]]

export function ReviewsView() {
  const [tab, setTab] = useState<Status | "all">("pending")
  const [search, setSearch] = useState("")
  const q = useDebounced(search.trim(), 350)
  const [rating, setRating] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const { data, error, refetch } = useAdminQuery(
    ["reviews", tab, q, rating, page],
    () =>
      adminQueries.reviews({
        status: tab === "all" ? undefined : tab,
        q,
        rating,
        page,
        limit: 20,
      }),
    { placeholderData: (prev) => prev }
  )
  const shown = data?.data ?? []
  const count = (s: Status) => data?.counts[s] ?? 0

  const clear = () => setSelected([])
  const setStatus = useAdminMutation(
    ({ ids, status }: { ids: string[]; status: Status }) =>
      adminActions.reviewStatus(ids, status),
    {
      invalidate: REVIEW_KEYS,
      shop: ["catalog"],
      success: (_r, v) => `${v.ids.length} review(s) ${v.status}`,
      onSuccess: clear,
    }
  )
  const remove = useAdminMutation((ids: string[]) => adminActions.deleteReviews(ids), {
    invalidate: REVIEW_KEYS,
    shop: ["catalog"],
    success: (_r, ids) => `${ids.length} review(s) deleted`,
    onSuccess: clear,
  })
  const act = (ids: string[], status: Status | "delete") =>
    status === "delete" ? remove.mutate(ids) : setStatus.mutate({ ids, status })
  const busy = setStatus.isPending || remove.isPending
  const reset = () => {
    setPage(1)
    clear()
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="New customer reviews show on the product page only after you approve them"
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setTab(t.value)
              reset()
            }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
              tab === t.value
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary"
            )}
          >
            {t.label}
            {t.value !== "all" && data && ` (${count(t.value)})`}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            reset()
          }}
          placeholder="Search name, text or product..."
          aria-label="Search reviews"
          className="w-full sm:max-w-xs"
        />
        <div className="flex gap-1" role="group" aria-label="Filter by rating">
          {[5, 4, 3, 2, 1].map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={rating === n ? "default" : "outline"}
              onClick={() => {
                setRating(rating === n ? null : n)
                reset()
              }}
              aria-pressed={rating === n}
            >
              {n}
              <Star className="size-3" />
            </Button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div
          role="toolbar"
          className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-2 text-sm"
        >
          <span className="px-1 font-medium">{selected.length} selected</span>
          <Button size="sm" disabled={busy} onClick={() => act(selected, "approved")}>
            <Check /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => act(selected, "hidden")}
          >
            <EyeOff /> Hide
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => act(selected, "delete")}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      )}

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No reviews here
        </p>
      ) : (
        <>
          <label className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <Checkbox
              checked={
                shown.every((r) => selected.includes(r.id))
                  ? true
                  : selected.length
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(v) =>
                setSelected(v === true ? shown.map((r) => r.id) : [])
              }
            />
            Select all shown
          </label>
          <ul className="space-y-3">
            {shown.map((r) => (
              <ReviewRow
                key={r.id}
                review={r}
                busy={busy}
                checked={selected.includes(r.id)}
                onCheck={(on) =>
                  setSelected((s) => (on ? [...s, r.id] : s.filter((id) => id !== r.id)))
                }
                onAct={(status) => act([r.id], status)}
              />
            ))}
          </ul>
          <Pager
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onChange={(p) => {
              setPage(p)
              clear()
            }}
          />
        </>
      )}
    </div>
  )
}

const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  hidden: "bg-zinc-200 text-zinc-700",
}

function ReviewRow({
  review: r,
  busy,
  checked,
  onCheck,
  onAct,
}: {
  review: AdminReview
  busy: boolean
  checked: boolean
  onCheck: (on: boolean) => void
  onAct: (status: Status | "delete") => void
}) {
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState(r.reply ?? "")
  const reply = useAdminMutation(
    (value: string) => adminActions.reviewReply(r.id, value),
    {
      invalidate: REVIEW_KEYS,
      shop: ["catalog"],
      success: (_r, value) => (value.trim() ? "Reply saved" : "Reply removed"),
      onSuccess: () => setReplying(false),
    }
  )

  return (
    <li className="flex gap-3 rounded-xl border bg-card p-4">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheck(v === true)}
        aria-label={`Select review by ${r.name}`}
        className="mt-1"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold">{r.name}</span>
          {r.verified && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-700">
              <BadgeCheck className="size-3.5" /> Verified buyer
            </span>
          )}
          {r.phone && (
            <a href={`tel:${r.phone}`} className="text-xs text-primary">
              {formatPhone(r.phone)}
            </a>
          )}
          <span
            className={cn("rounded-full px-2 py-0.5 text-xs", STATUS_STYLE[r.status])}
          >
            {r.status}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDate(r.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex" aria-label={`${r.rating} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-3.5",
                  i < r.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </span>
          on
          <Link
            href={`/products/${r.productSlug}`}
            target="_blank"
            className="truncate hover:text-primary hover:underline"
          >
            {r.productName}
          </Link>
        </div>
        <p className="text-sm">{r.text}</p>
        {r.reply && !replying && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="font-medium">Shop reply: </span>
            {r.reply}
          </p>
        )}
        {replying && (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              reply.mutate(text)
            }}
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Thank you so much! ..."
              aria-label="Reply"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={reply.isPending}>
                Save reply
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setReplying(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {r.status !== "approved" && (
            <Button size="sm" disabled={busy} onClick={() => onAct("approved")}>
              <Check /> Approve
            </Button>
          )}
          {r.status !== "hidden" && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onAct("hidden")}
            >
              <EyeOff /> Hide
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setReplying(true)}>
            <MessageSquareReply /> {r.reply ? "Edit reply" : "Reply"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="hover:text-destructive"
            disabled={busy}
            onClick={() => onAct("delete")}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      </div>
    </li>
  )
}
