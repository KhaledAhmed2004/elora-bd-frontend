"use client"

import { adminQueries, useAdminQuery } from "@/lib/admin/queries"
import { codDue } from "@/lib/orders"
import { FALLBACK_SETTINGS } from "@/lib/settings-fallback"
import { formatPhone, formatPrice } from "@/lib/format"
import type { Order } from "@/types"

/** Parcel label — prints 4 per A4 page (2 × 2). */
export function ShippingLabel({ order }: { order: Order }) {
  const { data } = useAdminQuery(["settings"], adminQueries.settings)
  const settings = data ?? FALLBACK_SETTINGS
  const a = order.shippingAddress
  const items = order.items.reduce((n, i) => n + i.quantity, 0)
  return (
    <div className="flex h-[135mm] flex-col border-2 border-dashed border-black p-4 text-black">
      <div className="flex items-start justify-between border-b border-black pb-2">
        <div>
          <p className="text-base font-bold">{settings.storeName}</p>
          <p className="text-xs">{settings.phone}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold">{order.orderNumber}</p>
          {order.courier && (
            <p className="text-xs">
              {order.courier.name}: {order.courier.trackingId}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1 py-3">
        <p className="text-xs uppercase">Ship to</p>
        <p className="text-xl font-bold">{a.fullName}</p>
        <p className="text-lg font-semibold">{formatPhone(a.phone)}</p>
        <p className="mt-1 text-sm leading-snug">
          {a.address}, {a.upazila}, {a.district}
        </p>
      </div>
      <div className="flex items-end justify-between border-t border-black pt-2">
        <p className="text-xs">
          {items} item(s)
          {order.note ? ` · Note: ${order.note}` : ""}
        </p>
        <div className="border-2 border-black px-3 py-1 text-right">
          <p className="text-[10px] uppercase">COD</p>
          <p className="text-2xl font-bold">{formatPrice(codDue(order))}</p>
        </div>
      </div>
    </div>
  )
}
