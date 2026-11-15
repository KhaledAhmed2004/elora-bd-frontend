import type { Metadata } from "next"

import { CartView } from "@/components/cart/cart-view"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"

export const metadata: Metadata = {
  title: "Shopping Cart",
  robots: { index: false },
}

export default function CartPage() {
  return (
    <div className="shop-container py-6">
      <Breadcrumbs items={[{ label: "Cart" }]} />
      <h1 className="mb-6 font-display text-2xl font-bold md:text-3xl">Shopping Cart</h1>
      <CartView />
    </div>
  )
}
