"use client"

import { useQuery } from "@tanstack/react-query"
import { Heart, MapPin, Package } from "lucide-react"
import Link from "next/link"

import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAuthStore } from "@/store/auth-store"
import { api } from "@/lib/api"
import { useRecentOrdersStore } from "@/store/recent-orders-store"
import { useWishlistStore } from "@/store/wishlist-store"
import type { Paginated, Product } from "@/types"

import { OrderCard } from "./order-card"
import { RequireAuth } from "./require-auth"

/** Orders placed from this browser for the signed-in number (account API comes with OTP login) */
function useMyOrders() {
  const phone = useAuthStore((s) => s.user?.phone)
  const orders = useRecentOrdersStore((s) => s.orders)
  return orders.filter((o) => o.shippingAddress.phone === phone)
}

export function AccountOverview() {
  return (
    <RequireAuth>
      <Overview />
    </RequireAuth>
  )
}

function Overview() {
  const user = useAuthStore((s) => s.user)!
  const addresses = useAuthStore((s) => s.addresses)
  const orders = useMyOrders()
  const wishCount = useWishlistStore((s) => s.productIds.length)

  const stats = [
    { label: "Total Orders", value: orders.length, icon: Package, href: "/account/orders" },
    { label: "Wishlist", value: wishCount, icon: Heart, href: "/account/wishlist" },
    {
      label: "Address",
      value: addresses.length,
      icon: MapPin,
      href: "/account/addresses",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Welcome back, {user.name.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">Everything about your account, in one place</p>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex flex-col gap-2 rounded-xl border p-3 transition-colors hover:border-primary sm:p-4"
            >
              <Icon className="size-5 text-primary" />
              <span className="text-2xl font-bold tabular-nums">{value}</span>
              <span className="text-xs text-muted-foreground sm:text-sm">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent Orders</h2>
          {orders.length > 0 && (
            <Link href="/account/orders" className="text-sm text-primary hover:underline">
              See All
            </Link>
          )}
        </div>
        {orders.length ? (
          <div className="space-y-3">
            {orders.slice(0, 2).map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        ) : (
          <EmptyOrders />
        )}
      </section>
    </div>
  )
}

export function AccountOrders() {
  return (
    <RequireAuth>
      <Orders />
    </RequireAuth>
  )
}

function Orders() {
  const orders = useMyOrders()
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Orders</h1>
      {orders.length ? (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <EmptyOrders />
      )}
    </div>
  )
}

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
      <Package className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet</p>
      <Button asChild>
        <Link href="/products">Start Shopping</Link>
      </Button>
    </div>
  )
}

/** Works for guests too — the wishlist lives in this browser. */
export function AccountWishlist() {
  const hydrated = useHydrated()
  const ids = useWishlistStore((s) => s.productIds)
  const { data, isPending } = useQuery({
    queryKey: ["wishlist-products", ids],
    queryFn: () =>
      api
        .get<Paginated<Product>>("/products", {
          params: { ids: ids.join(","), limit: 60 },
        })
        .then((r) => r.data.data),
    enabled: hydrated && ids.length > 0,
  })
  // Keep the order the customer saved them in
  const items = ids.flatMap((id) => data?.find((p) => p.id === id) ?? [])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">
        Wishlist {hydrated && items.length > 0 && `(${items.length})`}
      </h1>
      {!hydrated || (ids.length > 0 && isPending) ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <Heart className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Tap ♡ on any product you love to save it here
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
