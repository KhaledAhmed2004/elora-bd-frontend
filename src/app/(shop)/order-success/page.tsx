import type { Metadata } from "next"
import { Suspense } from "react"

import { OrderSuccessView } from "@/components/order/order-success-view"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
}

export default function OrderSuccessPage() {
  return (
    <div className="shop-container py-10">
      <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-2xl rounded-2xl" />}>
        <OrderSuccessView />
      </Suspense>
    </div>
  )
}
