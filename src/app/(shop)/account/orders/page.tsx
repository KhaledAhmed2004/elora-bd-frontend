import type { Metadata } from "next"

import { AccountOrders } from "@/components/account/account-views"

export const metadata: Metadata = { title: "My Orders" }

export default function OrdersPage() {
  return <AccountOrders />
}
