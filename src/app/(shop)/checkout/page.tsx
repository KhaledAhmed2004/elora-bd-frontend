import type { Metadata } from "next"

import { CheckoutView } from "@/components/checkout/checkout-view"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
}

export default function CheckoutPage() {
  return (
    <div className="shop-container py-6">
      <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mb-6 font-display text-2xl font-bold md:text-3xl">Checkout</h1>
      <CheckoutView />
    </div>
  )
}
