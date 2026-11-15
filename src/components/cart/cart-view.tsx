"use client"

import { ArrowRight, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import { formatPrice } from "@/lib/format"
import { type Totals, useCartQuote } from "@/lib/pricing"
import { useSiteSettings } from "@/providers/site-settings"
import { variantLabel } from "@/lib/variants"
import { useCartStore } from "@/store/cart-store"
import type { CartItem } from "@/types"

import { CouponForm } from "./coupon-form"
import { OrderTotals } from "./order-totals"
import { QuantityStepper } from "./quantity-stepper"

export function CartView() {
  const hydrated = useHydrated()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const totals = useCartQuote()
  const freeMin = useSiteSettings().delivery.freeDeliveryMinimum

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-9 text-muted-foreground" />
        </span>
        <div>
          <p className="text-lg font-semibold">Your cart is empty</p>
          <p className="text-sm text-muted-foreground">
            Add products you love to your cart
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    )
  }

  const remaining = Math.max(0, freeMin - totals.subtotal)

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <section aria-label="Cart items" className="rounded-2xl border">
        <div className="flex items-center justify-between border-b px-4 py-3 md:px-6">
          <p className="text-sm font-medium">{items.length} {items.length === 1 ? "item" : "items"}</p>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Clear Cart
          </button>
        </div>
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 p-4 md:px-6">
              <Link
                href={`/products/${item.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted md:size-28"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex justify-between gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 font-medium hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.name}`}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.key)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {item.attributes && (
                  <p className="text-sm text-muted-foreground">
                    {variantLabel(item.attributes)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.price)} / piece
                </p>
                <ItemProblem totals={totals} item={item} />
                <div className="mt-auto flex items-center justify-between pt-2">
                  <QuantityStepper
                    value={item.quantity}
                    max={item.maxStock}
                    onChange={(q) => updateQuantity(item.key, q)}
                  />
                  <span className="font-semibold tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-32">
        <div className="space-y-4 rounded-2xl border p-5">
          <h2 className="font-semibold">Order Summary</h2>
          {remaining > 0 ? (
            <p className="flex items-center gap-2 rounded-lg bg-accent/60 px-3 py-2 text-xs">
              <Truck className="size-4 shrink-0 text-primary" />
              <span>
                Add <strong>{formatPrice(remaining)}</strong> more for{" "}
                <strong>Free Delivery</strong>
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded-lg bg-accent/60 px-3 py-2 text-xs font-medium text-primary">
              <Truck className="size-4" /> You&apos;ve got Free Delivery!
            </p>
          )}
          <CouponForm
            subtotal={totals.subtotal}
            applied={totals.coupon}
            staleError={totals.couponError}
          />
          <OrderTotals totals={totals} />
          <Button asChild size="lg" className="h-12 w-full text-base">
            <Link href="/checkout">
              Proceed to Checkout <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="link" className="w-full">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" /> Cash on Delivery · 7-day easy
          exchange
        </p>
      </aside>
    </div>
  )
}

/** "Only 2 left in stock" etc., from the server quote */
export function ItemProblem({
  totals,
  item,
}: {
  totals: Totals
  item: Pick<CartItem, "productId" | "variantId">
}) {
  const problem = totals.problems.find(
    (p) =>
      p.productId === item.productId && (p.variantId ?? null) === (item.variantId ?? null)
  )
  if (!problem) return null
  return <p className="text-xs font-medium text-destructive">{problem.message}</p>
}
