import type { Metadata } from "next"

import { OrdersView } from "@/components/admin/orders-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Orders" }

export default function AdminOrdersPage() {
  return <OrdersView />
}
