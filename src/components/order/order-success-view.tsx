"use client"

import { CheckCircle2, Copy, PhoneCall, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import { formatPhone, formatPrice } from "@/lib/format"
import { codDue } from "@/lib/orders"
import { variantLabel } from "@/lib/variants"
import { useRecentOrdersStore } from "@/store/recent-orders-store"

const PAYMENT_LABEL = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  sslcommerz: "Card / Online",
} as const

/** Uses useSearchParams → render inside <Suspense>. */
export function OrderSuccessView() {
  const hydrated = useHydrated()
  const orderNumber = useSearchParams().get("order")
  const order = useRecentOrdersStore((s) =>
    s.orders.find((o) => o.orderNumber === orderNumber)
  )

  if (!hydrated) return <Skeleton className="mx-auto h-96 max-w-2xl rounded-2xl" />

  if (!order) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-lg font-semibold">We couldn&apos;t find this order</p>
        <p className="text-sm text-muted-foreground">
          If you have your order number, you can check it on the Track Order page.
        </p>
        <Button asChild>
          <Link href="/track-order">Track Order</Link>
        </Button>
      </div>
    )
  }

  const a = order.shippingAddress

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent">
          <CheckCircle2 className="size-9 text-primary" />
        </span>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          Thank you, {a.fullName.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">We&apos;ve received your order.</p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(order.orderNumber)
            toast.success("Order number copied")
          }}
          className="flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm"
        >
          Order No: <strong className="tracking-wide">{order.orderNumber}</strong>
          <Copy className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex gap-3 rounded-xl border p-4">
          <PhoneCall className="size-5 shrink-0 text-primary" />
          <p className="text-sm">
            <strong className="block">Confirmation call</strong>
            <span className="text-muted-foreground">
              We&apos;ll call {formatPhone(a.phone)} within 24 hours to confirm your
              order.
            </span>
          </p>
        </div>
        <div className="flex gap-3 rounded-xl border p-4">
          <Truck className="size-5 shrink-0 text-primary" />
          <p className="text-sm">
            <strong className="block">Delivery</strong>
            <span className="text-muted-foreground">
              Arrives within {a.district === "Dhaka" ? "1-2 days" : "3-5 days"}.
            </span>
          </p>
        </div>
      </div>

      <section className="rounded-2xl border">
        <h2 className="border-b px-5 py-3 font-semibold">Order Details</h2>
        <ul className="divide-y">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-1 font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.attributes && `${variantLabel(item.attributes)} · `}
                  {item.quantity} × {formatPrice(item.price)}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t px-5 py-4 text-sm">
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          {order.discount > 0 && (
            <Row label="Discount" value={`−${formatPrice(order.discount)}`} />
          )}
          <Row
            label="Delivery"
            value={order.deliveryCharge ? formatPrice(order.deliveryCharge) : "Free"}
          />
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total)}</dd>
          </div>
          {order.advance && (
            <Row
              label={`Advance (${order.advance.method === "nagad" ? "Nagad" : "bKash"} · ${order.advance.trxId})`}
              value={`−${formatPrice(order.advance.amount)}`}
            />
          )}
          {order.paymentMethod === "cod" && (
            <div className="flex justify-between text-base font-bold text-primary">
              <dt>Pay on Delivery</dt>
              <dd className="tabular-nums">{formatPrice(codDue(order))}</dd>
            </div>
          )}
        </dl>
        <div className="grid gap-4 border-t px-5 py-4 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 font-semibold">Delivery Address</p>
            <p className="text-muted-foreground">
              {a.fullName}
              <br />
              {a.address}, {a.upazila}, {a.district}
              <br />
              {formatPhone(a.phone)}
            </p>
          </div>
          <div>
            <p className="mb-1 font-semibold">Payment</p>
            <p className="text-muted-foreground">{PAYMENT_LABEL[order.paymentMethod]}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href={`/track-order?order=${order.orderNumber}`}>Track Order</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
