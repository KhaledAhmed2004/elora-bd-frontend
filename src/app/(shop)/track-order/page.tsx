import type { Metadata } from "next"
import { Suspense } from "react"

import { TrackOrderView } from "@/components/order/track-order-view"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Track Order",
  description: "Check your order status with your order number and mobile number.",
}

export default function TrackOrderPage() {
  return (
    <div className="shop-container py-6">
      <Breadcrumbs items={[{ label: "Track Order" }]} />
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Track Your Order</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your order number and mobile number to see where your order is
        </p>
      </div>
      <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-2xl rounded-2xl" />}>
        <TrackOrderView />
      </Suspense>
    </div>
  )
}
