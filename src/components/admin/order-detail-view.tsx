"use client"

import {
  ArrowLeft,
  Ban,
  Check,
  Pencil,
  Phone,
  PhoneCall,
  Printer,
  RotateCcw,
  Truck,
  Undo2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"

import { STATUS_STYLE } from "@/components/account/order-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFieldId } from "@/hooks/use-field-id"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CALL_RESULT_LABEL,
  COURIERS,
  type CourierName,
  SOURCE_LABEL,
} from "@/lib/admin/constants"
import {
  adminActions,
  type AdminOrder,
  adminQueries,
  type CustomerRisk,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { isApiStatus } from "@/lib/api"
import { formatPhone, formatPrice } from "@/lib/format"
import { codDue } from "@/lib/orders"
import { variantLabel } from "@/lib/variants"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"
import type { CallResult, OrderStatus } from "@/types"

import { ADMIN_STATUS_LABEL, PAYMENT_LABEL, QueryError, StatusBadge } from "./admin-ui"
import { Invoice } from "./invoice"
import { RiskBadge } from "./risk-badge"

const STATUSES = Object.keys(STATUS_STYLE) as OrderStatus[]
/** Every order write refreshes these lists */
const ORDER_KEYS = [["orders"], ["dashboard"], ["customers"]]

type Order = AdminOrder

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

/** Uses useParams → rendered inside the admin layout's <Suspense>. */
export function OrderDetailView() {
  const { id } = useParams<{ id: string }>()
  const role = useAdminAuthStore((s) => s.admin?.role)
  const {
    data: order,
    error,
    refetch,
  } = useAdminQuery(["orders", "detail", id], () => adminQueries.order(id))
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("")
  const [statusNote, setStatusNote] = useState("")
  const [courier, setCourier] = useState<CourierName>("Steadfast")
  const [returnOpen, setReturnOpen] = useState(false)
  const setStatus = useAdminMutation(
    (v: { status: OrderStatus; note?: string }) => adminActions.setStatus(id, v),
    {
      invalidate: ORDER_KEYS,
      success: (_r, v) => `Status: ${ADMIN_STATUS_LABEL[v.status]}`,
      onSuccess: () => {
        setNextStatus("")
        setStatusNote("")
      },
    }
  )
  const book = useAdminMutation(() => adminActions.bookCourier([id], courier), {
    invalidate: ORDER_KEYS,
    success: (r) =>
      r.booked.length
        ? `Booked with ${courier}`
        : `Not booked: ${r.skipped[0]?.error ?? ""}`,
  })
  const verify = useAdminMutation(() => adminActions.verifyAdvance(id, true), {
    invalidate: ORDER_KEYS,
    success: "Advance verified",
  })
  const printRef = useRef<HTMLDivElement>(null)
  const print = useReactToPrint({
    contentRef: printRef,
    documentTitle: order ? `Invoice-${order.orderNumber}` : "Invoice",
  })

  if (error && !isApiStatus(error, 404)) {
    return <QueryError error={error} onRetry={() => void refetch()} />
  }
  if (!order && !error) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }
  if (!order) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="font-semibold">Order not found</p>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Back to orders</Link>
        </Button>
      </div>
    )
  }

  const a = order.shippingAddress
  const closed = ["delivered", "cancelled", "returned"].includes(order.status)
  const risk = order.risk
  const due = codDue(order)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm" aria-label="Back">
          <Link href="/admin/orders">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="mr-auto">
          <h1 className="flex flex-wrap items-center gap-2 font-heading text-2xl font-bold">
            {order.orderNumber} <StatusBadge status={order.status} />
          </h1>
          <p className="text-sm text-muted-foreground">
            {dateTime(order.createdAt)} · {SOURCE_LABEL[order.source ?? "website"]}
          </p>
        </div>
        {!closed && order.status !== "shipped" && (
          <Button asChild variant="outline">
            <Link href={`/admin/orders/${order.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={() => print()}>
          <Printer /> Invoice
        </Button>
        {(order.status === "shipped" || order.status === "delivered") &&
          can.manage(role) && (
            <Button variant="outline" onClick={() => setReturnOpen(true)}>
              <Undo2 /> Return
            </Button>
          )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {order.status === "pending" && <CallPanel order={order} />}

          <section className="rounded-xl border bg-card">
            <h2 className="border-b px-4 py-3 font-semibold">
              Product ({order.items.length})
            </h2>
            <ul className="divide-y">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={it.image}
                      alt=""
                      fill
                      sizes="56px"
                      unoptimized
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.attributes && `${variantLabel(it.attributes)} · `}
                      {formatPrice(it.price)} × {it.quantity}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(it.price * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t px-4 py-3 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Row label="Discount" value={`−${formatPrice(order.discount)}`} />
              )}
              <Row label="Delivery" value={formatPrice(order.deliveryCharge)} />
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
              {order.advance && (
                <Row
                  label={`Advance (${order.advance.method})`}
                  value={`−${formatPrice(order.advance.amount)}`}
                />
              )}
              {order.paymentMethod === "cod" && (
                <div className="flex justify-between font-semibold text-primary">
                  <dt>COD amount due</dt>
                  <dd className="tabular-nums">{formatPrice(due)}</dd>
                </div>
              )}
            </dl>
          </section>

          {!closed && order.status !== "pending" && !order.courier && (
            <section className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
              <Truck className="size-5 text-primary" />
              <span className="mr-auto font-semibold">Send to courier</span>
              <Select value={courier} onValueChange={(v) => setCourier(v as CourierName)}>
                <SelectTrigger className="w-36" aria-label="Courier">
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
              <Button disabled={book.isPending} onClick={() => book.mutate()}>
                Send via {courier}
              </Button>
            </section>
          )}

          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-semibold">Update status</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={nextStatus}
                onValueChange={(v) => setNextStatus(v as OrderStatus)}
              >
                <SelectTrigger className="w-full sm:w-52" aria-label="New status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} disabled={s === order.status}>
                      {ADMIN_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Note (optional)"
                rows={1}
                className="min-h-9 flex-1"
              />
              <Button
                disabled={!nextStatus || setStatus.isPending}
                onClick={() => {
                  if (!nextStatus) return
                  setStatus.mutate({
                    status: nextStatus,
                    note: statusNote.trim() || undefined,
                  })
                }}
              >
                Update
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Confirming deducts stock; cancelling returns it to stock.
            </p>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-4 font-semibold">Timeline</h2>
            <ol className="space-y-4">
              {timeline(order).map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {h.kind === "call" ? (
                      <PhoneCall className="size-3" />
                    ) : (
                      <Check className="size-3" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium">{h.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateTime(h.at)}
                      {h.by && ` · ${h.by}`}
                    </p>
                    {h.note && <p className="mt-0.5 text-muted-foreground">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card p-4 text-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Customer</h2>
              <RiskBadge risk={risk} />
            </div>
            <p className="font-medium">{a.fullName}</p>
            <a
              href={`tel:${a.phone}`}
              className="mt-1 flex items-center gap-1.5 text-primary"
            >
              <Phone className="size-3.5" /> {formatPhone(a.phone)}
            </a>
            <p className="mt-3 text-muted-foreground">
              {a.address}
              <br />
              {a.upazila}, {a.district}, {a.division}
            </p>
            {order.note && (
              <p className="mt-3 rounded-md bg-amber-50 p-2 text-amber-900">
                <strong>Customer note:</strong> {order.note}
              </p>
            )}
          </section>

          <RiskPanel phone={a.phone} risk={risk} />

          <section className="space-y-2 rounded-xl border bg-card p-4 text-sm">
            <h2 className="mb-1 font-semibold">Payment & delivery</h2>
            <Row label="Method" value={PAYMENT_LABEL[order.paymentMethod]} />
            <Row
              label="Payment"
              value={
                order.paymentStatus === "paid"
                  ? "Paid ✓"
                  : order.paymentStatus === "refunded"
                    ? `Refunded ${formatPrice(order.refund?.amount ?? 0)}`
                    : "Unpaid"
              }
            />
            <Row
              label="Courier"
              value={
                order.courier
                  ? `${order.courier.name} · ${order.courier.trackingId}`
                  : "—"
              }
            />
            {order.courier && (
              <Row
                label="COD settlement"
                value={order.courier.settled ? "Received ✓" : "Pending"}
              />
            )}
            {order.advance && (
              <div className="mt-2 space-y-1.5 rounded-lg border border-dashed p-3">
                <p className="font-medium">
                  Advance: {formatPrice(order.advance.amount)} ({order.advance.method})
                </p>
                <p className="text-xs text-muted-foreground">
                  TrxID: <span className="font-mono">{order.advance.trxId}</span>
                  {order.advance.senderNumber && ` · ${order.advance.senderNumber}`}
                </p>
                {order.advance.verified ? (
                  <p className="text-xs font-medium text-primary">✓ Verified</p>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={verify.isPending}
                      onClick={() => verify.mutate()}
                    >
                      Verify
                    </Button>
                    <span className="self-center text-xs text-amber-700">
                      Match with bKash/Nagad statement
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          <AdminNote key={order.adminNote ?? ""} order={order} />
        </aside>
      </div>

      <ReturnDialog order={order} open={returnOpen} onOpenChange={setReturnOpen} />

      {/* Print-only content: react-to-print copies this node into an iframe */}
      <div className="hidden">
        <div ref={printRef}>
          <Invoice order={order} />
        </div>
      </div>
    </div>
  )
}

function timeline(order: Order) {
  const status = (order.history ?? [{ status: order.status, at: order.createdAt }]).map(
    (h) => ({
      kind: "status" as const,
      at: h.at,
      title: ADMIN_STATUS_LABEL[h.status],
      note: h.note,
      by: h.by,
    })
  )
  const calls = (order.callLog ?? []).map((c) => ({
    kind: "call" as const,
    at: c.at,
    title: `Call: ${CALL_RESULT_LABEL[c.result]}`,
    note: c.note,
    by: c.by,
  }))
  return [...status, ...calls].sort((x, y) => y.at.localeCompare(x.at))
}

function CallPanel({ order }: { order: Order }) {
  const [note, setNote] = useState("")
  const call = useAdminMutation(
    (r: CallResult) =>
      adminActions.logCall(order.id, { result: r, note: note.trim() || undefined }),
    {
      invalidate: ORDER_KEYS,
      success: (_res, r) => CALL_RESULT_LABEL[r],
      onSuccess: () => setNote(""),
    }
  )
  const calls = order.callLog?.length ?? 0
  const results: {
    r: CallResult
    label: string
    variant: "default" | "outline" | "destructive"
  }[] = [
    { r: "confirmed", label: "Confirm", variant: "default" },
    { r: "no-answer", label: "No answer", variant: "outline" },
    { r: "busy", label: "Busy/Off", variant: "outline" },
    { r: "callback", label: "Call back later", variant: "outline" },
    { r: "cancelled", label: "Cancel", variant: "destructive" },
  ]
  return (
    <section className="space-y-3 rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <PhoneCall className="size-5 text-amber-700" />
        <h2 className="mr-auto font-semibold">
          Confirmation call{" "}
          {calls > 0 && (
            <span className="text-sm font-normal">({calls} call(s) made)</span>
          )}
        </h2>
        <Button asChild size="sm">
          <a href={`tel:${order.shippingAddress.phone}`}>
            <Phone /> {formatPhone(order.shippingAddress.phone)}
          </a>
        </Button>
      </div>
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (e.g. asked to call after 5 pm / reason for cancelling)"
        aria-label="Call note"
        className="bg-background"
      />
      <div className="flex flex-wrap gap-2">
        {results.map(({ r, label, variant }) => (
          <Button
            key={r}
            size="sm"
            variant={variant}
            disabled={call.isPending}
            onClick={() => call.mutate(r)}
          >
            {label}
          </Button>
        ))}
      </div>
    </section>
  )
}

function RiskPanel({ phone, risk }: { phone: string; risk: CustomerRisk }) {
  const fid = useFieldId()
  const [reason, setReason] = useState("")
  const [open, setOpen] = useState(false)
  const add = useAdminMutation(() => adminActions.blacklist(phone, reason.trim()), {
    invalidate: [...ORDER_KEYS, ["blacklist"]],
    success: "Added to blacklist",
    onSuccess: () => setOpen(false),
  })
  const remove = useAdminMutation(() => adminActions.unblacklist(phone), {
    invalidate: [...ORDER_KEYS, ["blacklist"]],
    success: "Removed from blacklist",
  })

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4 text-sm">
      <h2 className="font-semibold">Fraud check</h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Orders" value={risk.own.total + (risk.courier?.total ?? 0)} />
        <Stat
          label="Delivered"
          value={risk.own.delivered + (risk.courier?.delivered ?? 0)}
        />
        <Stat
          label="Returned"
          value={risk.own.returned + (risk.courier?.returned ?? 0)}
          danger
        />
      </div>
      <p className="text-xs text-muted-foreground">
        This shop: {risk.own.total} orders ({risk.own.cancelled} cancelled)
        {risk.successRate !== null && ` · ${risk.successRate}% delivered`}
        {risk.courier
          ? ` · Courier network: ${risk.courier.total} parcels`
          : " · Courier network history: not connected yet"}
      </p>
      {risk.level === "blacklisted" ? (
        <div className="space-y-2 rounded-lg bg-zinc-900 p-3 text-white">
          <p className="text-xs">Blacklist: {risk.blacklistReason}</p>
          <Button
            size="sm"
            variant="secondary"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Remove from blacklist
          </Button>
        </div>
      ) : open ? (
        <div className="space-y-2">
          <Field>
            <FieldLabel htmlFor={fid("reason")}>Reason for blacklisting</FieldLabel>
            <Input
              id={fid("reason")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Ordered 3 times but never accepted delivery"
            />
          </Field>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={!reason.trim() || add.isPending}
              onClick={() => add.mutate()}
            >
              Blacklist
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Ban /> Add to blacklist
        </Button>
      )}
    </section>
  )
}

function AdminNote({ order }: { order: Order }) {
  const fid = useFieldId()
  const [value, setValue] = useState(order.adminNote ?? "")
  const dirty = value !== (order.adminNote ?? "")
  const save = useAdminMutation(() => adminActions.setNote(order.id, value.trim()), {
    invalidate: [["orders", "detail", order.id]],
    success: "Note saved",
  })
  return (
    <section className="space-y-2 rounded-xl border bg-card p-4 text-sm">
      <label htmlFor={fid("adminNote")} className="font-semibold">
        Internal note
      </label>
      <Textarea
        id={fid("adminNote")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Visible to admins only"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!dirty || save.isPending}
        onClick={() => save.mutate()}
      >
        Save
      </Button>
    </section>
  )
}

function ReturnDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const fid = useFieldId()
  const paid = order.paymentStatus === "paid" ? order.total : (order.advance?.amount ?? 0)
  const [reason, setReason] = useState("")
  const [restock, setRestock] = useState(true)
  const [refund, setRefund] = useState<number>(paid)
  const [method, setMethod] = useState("bKash")
  const ret = useAdminMutation(
    () =>
      adminActions.processReturn(order.id, {
        reason: reason.trim(),
        restock,
        refundAmount: refund,
        refundMethod: method,
      }),
    {
      invalidate: ORDER_KEYS,
      success: "Return received",
      onSuccess: () => onOpenChange(false),
    }
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive return</DialogTitle>
          <DialogDescription>
            {order.orderNumber} — has the courier returned the parcel?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor={fid("reason")}>Reason</FieldLabel>
            <Input
              id={fid("reason")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer refused delivery / wrong size"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={restock} onCheckedChange={(v) => setRestock(v === true)} />
            Product is in good condition — return to stock
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor={fid("refund")}>Refund (৳)</FieldLabel>
              <Input
                id={fid("refund")}
                type="number"
                min={0}
                value={refund}
                onChange={(e) => setRefund(Number(e.target.value) || 0)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={fid("method")}>Refund method</FieldLabel>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id={fid("method")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["bKash", "Nagad", "Bank", "Cash"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!reason.trim() || ret.isPending} onClick={() => ret.mutate()}>
            <RotateCcw /> Confirm return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string
  value: number
  danger?: boolean
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <p
        className={
          danger && value > 0 ? "text-lg font-bold text-destructive" : "text-lg font-bold"
        }
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  )
}
