import Image from "next/image"
import Link from "next/link"

import { formatDate, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus } from "@/types"

export const STATUS_STYLE: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", className: "bg-sky-100 text-sky-800" },
  processing: { label: "Packing", className: "bg-sky-100 text-sky-800" },
  shipped: { label: "Shipped", className: "bg-violet-100 text-violet-800" },
  delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
  returned: { label: "Returned", className: "bg-zinc-200 text-zinc-800" },
}

export function OrderCard({ order }: { order: Order }) {
  const status = STATUS_STYLE[order.status]
  return (
    <article className="rounded-xl border">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <span
          className={cn("rounded-full px-2.5 py-1 text-xs font-medium", status.className)}
        >
          {status.label}
        </span>
      </header>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex -space-x-3">
          {order.items.slice(0, 3).map((item, i) => (
            <span
              key={i}
              className="relative size-12 overflow-hidden rounded-lg border-2 border-background bg-muted"
            >
              <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
            </span>
          ))}
        </div>
        <p className="line-clamp-1 flex-1 text-sm text-muted-foreground">
          {order.items.map((i) => i.name).join(", ")}
        </p>
      </div>
      <footer className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-sm">
          Total: <strong className="tabular-nums">{formatPrice(order.total)}</strong>
        </p>
        <Link
          href={`/track-order?order=${order.orderNumber}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Track Order →
        </Link>
      </footer>
    </article>
  )
}
