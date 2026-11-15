import { formatPrice } from "@/lib/format"
import type { Totals } from "@/lib/pricing"

export function OrderTotals({ totals }: { totals: Totals }) {
  const { subtotal, discount, deliveryCharge, deliveryKnown, total, coupon } = totals

  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-primary">
          <dt>Discount {coupon && `(${coupon.code})`}</dt>
          <dd className="tabular-nums">−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Delivery Charge</dt>
        <dd className="tabular-nums">
          {!deliveryKnown ? (
            <span className="text-xs text-muted-foreground">District bachai korle</span>
          ) : deliveryCharge === 0 ? (
            <span className="font-medium text-primary">Free</span>
          ) : (
            formatPrice(deliveryCharge)
          )}
        </dd>
      </div>
      <div className="flex justify-between border-t pt-3 text-base font-bold">
        <dt>Mot</dt>
        <dd className="tabular-nums">{formatPrice(total)}</dd>
      </div>
    </dl>
  )
}
