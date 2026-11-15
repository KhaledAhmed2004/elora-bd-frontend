"use client"

import { Heart, ShoppingCart, User } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAuthStore } from "@/store/auth-store"
import { selectCartCount, useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold text-sale-foreground tabular-nums">
      {count > 99 ? "99+" : count}
    </span>
  )
}

export function HeaderActions() {
  const hydrated = useHydrated()
  const cartCount = useCartStore(selectCartCount)
  const wishCount = useWishlistStore((s) => s.productIds.length)
  const openCart = useCartStore((s) => s.openCart)
  const name = useAuthStore((s) => s.user?.name)
  const userInitial = hydrated && name ? name.charAt(0).toUpperCase() : null

  return (
    <div className="flex items-center gap-1">
      <Button
        asChild
        variant="ghost"
        size="icon-lg"
        className="relative hidden md:inline-flex"
      >
        <Link href="/account/wishlist" aria-label="Wishlist">
          <Heart className="size-5" />
          <CountBadge count={hydrated ? wishCount : 0} />
        </Link>
      </Button>

      <Button asChild variant="ghost" size="icon-lg" className="hidden md:inline-flex">
        <Link href="/account" aria-label={userInitial ? "My Account" : "Login"}>
          {userInitial ? (
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {userInitial}
            </span>
          ) : (
            <User className="size-5" />
          )}
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon-lg"
        className="relative"
        aria-label={`Cart, ${hydrated ? cartCount : 0} item`}
        onClick={openCart}
      >
        <ShoppingCart className="size-5" />
        <CountBadge count={hydrated ? cartCount : 0} />
      </Button>
    </div>
  )
}
