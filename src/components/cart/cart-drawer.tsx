"use client"

import { ShoppingBag, Trash2, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { siteConfig } from "@/config/site"
import { useHydrated } from "@/hooks/use-hydrated"
import { formatPrice } from "@/lib/format"
import { variantLabel } from "@/lib/variants"
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/store/cart-store"

import { QuantityStepper } from "./quantity-stepper"

export function CartDrawer() {
  const hydrated = useHydrated()
  const isOpen = useCartStore((s) => s.isOpen)
  const items = useCartStore((s) => s.items)
  const count = useCartStore(selectCartCount)
  const subtotal = useCartStore(selectCartSubtotal)
  const { closeCart, updateQuantity, removeItem } = useCartStore.getState()

  const freeMin = siteConfig.delivery.freeDeliveryMinimum
  const remaining = Math.max(0, freeMin - subtotal)
  const progress = Math.min(100, (subtotal / freeMin) * 100)

  return (
    <Sheet open={hydrated && isOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Your Cart ({count})</SheetTitle>
          <SheetDescription className="sr-only">Items in your cart</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-9 text-muted-foreground" />
            </span>
            <div>
              <p className="font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Add products you love to your cart
              </p>
            </div>
            <Button asChild onClick={closeCart}>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free delivery progress */}
            <div className="border-b bg-accent/50 px-4 py-3">
              <p className="mb-2 flex items-center gap-2 text-xs">
                <Truck className="size-4 text-primary" />
                {remaining > 0 ? (
                  <span>
                    Add <strong>{formatPrice(remaining)}</strong> more for{" "}
                    <strong>Free Delivery!</strong>
                  </span>
                ) : (
                  <strong className="text-primary">
                    You&apos;ve got Free Delivery! 🎉
                  </strong>
                )}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-medium hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    {item.attributes && (
                      <p className="text-xs text-muted-foreground">
                        {variantLabel(item.attributes)}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QuantityStepper
                        value={item.quantity}
                        max={item.maxStock}
                        onChange={(q) => updateQuantity(item.key, q)}
                      />
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.key)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>

            <SheetFooter className="border-t bg-background">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Delivery charge is added at checkout
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="lg" onClick={closeCart}>
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button asChild size="lg" onClick={closeCart}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
