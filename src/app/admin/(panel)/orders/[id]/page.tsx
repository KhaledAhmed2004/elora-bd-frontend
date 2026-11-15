import type { Metadata } from "next"

import { OrderDetailView } from "@/components/admin/order-detail-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Order Details" }

/** Orders live in the browser for now, so the id is read on the client. */
export default function AdminOrderDetailPage() {
  return <OrderDetailView />
}
